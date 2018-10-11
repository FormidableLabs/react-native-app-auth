/*! @file OIDLoopbackHTTPServer.m
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2016 The AppAuth Authors.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import "OIDLoopbackHTTPServer.h"
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

// We'll ignore the pointer arithmetic warnings for now.
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wpointer-arith"

@implementation HTTPServer

- (id)init {
    self = [super init];
    connClass = [HTTPConnection self];
    connections = [[NSMutableArray alloc] init];
    return self;
}

- (Class)connectionClass {
    return connClass;
}

- (void)setConnectionClass:(Class)value {
    connClass = value;
}

// Removes the connection from the list of active connections.
- (void)removeConnection:(HTTPConnection *)connection {
    [connections removeObject:connection];
}

// Converts the TCPServer delegate notification into the HTTPServer delegate method.
- (void)handleNewConnectionFromAddress:(NSData *)addr inputStream:(NSInputStream *)istr outputStream:(NSOutputStream *)ostr {
    HTTPConnection *connection = [[connClass alloc] initWithPeerAddress:addr inputStream:istr outputStream:ostr forServer:self];
    // Adds connection to the active connection list to retain it.
    [connections addObject:connection];
    [connection setDelegate:[self delegate]];
    if ([self delegate] && [[self delegate] respondsToSelector:@selector(HTTPServer:didMakeNewConnection:)]) {
        [[self delegate] HTTPServer:self didMakeNewConnection:connection];
    }
}

@end


@implementation HTTPConnection

- (id)init {
    return nil;
}

- (id)initWithPeerAddress:(NSData *)addr inputStream:(NSInputStream *)istr outputStream:(NSOutputStream *)ostr forServer:(HTTPServer *)serv {
    peerAddress = [addr copy];
    server = serv;
    istream = istr;
    ostream = ostr;
    [istream setDelegate:self];
    [ostream setDelegate:self];
    [istream scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:(id)kCFRunLoopCommonModes];
    [ostream scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:(id)kCFRunLoopCommonModes];
    [istream open];
    [ostream open];
    isValid = YES;
    return self;
}

- (void)dealloc {
    [self invalidate];
}

- (id)delegate {
    return delegate;
}

- (void)setDelegate:(id)value {
    delegate = value;
}

- (NSData *)peerAddress {
    return peerAddress;
}

- (HTTPServer *)server {
    return server;
}

- (HTTPServerRequest *)nextRequest {
  for (HTTPServerRequest *request in requests) {
    if (![request response]) {
      return request;
    }
  }
  return nil;
}

- (BOOL)isValid {
    return isValid;
}

- (void)invalidate {
    if (isValid) {
        isValid = NO;
        [server removeConnection:self];
        [istream setDelegate:nil];
        [ostream setDelegate:nil];
        [istream close];
        [ostream close];
        istream = nil;
        ostream = nil;
        ibuffer = nil;
        obuffer = nil;
        requests = nil;
    }
}

// YES return means that a complete request was parsed, and the caller
// should call again as the buffered bytes may have another complete
// request available.
- (BOOL)processIncomingBytes {
    CFHTTPMessageRef working = CFHTTPMessageCreateEmpty(kCFAllocatorDefault, TRUE);
    CFHTTPMessageAppendBytes(working, [ibuffer bytes], [ibuffer length]);

    // This "try and possibly succeed" approach is potentially expensive
    // (lots of bytes being copied around), but the only API available for
    // the server to use, short of doing the parsing itself.

    // HTTPConnection does not handle the chunked transfer encoding
    // described in the HTTP spec.  And if there is no Content-Length
    // header, then the request is the remainder of the stream bytes.

    if (CFHTTPMessageIsHeaderComplete(working)) {
        NSString *contentLengthValue = (__bridge_transfer NSString *)CFHTTPMessageCopyHeaderFieldValue(working, (CFStringRef)@"Content-Length");
        
        unsigned contentLength = contentLengthValue ? [contentLengthValue intValue] : 0;
        NSData *body = (__bridge_transfer NSData *)CFHTTPMessageCopyBody(working);
        NSUInteger bodyLength = [body length];
        if (contentLength <= bodyLength) {
            NSData *newBody = [NSData dataWithBytes:[body bytes] length:contentLength];
            [ibuffer setLength:0];
            [ibuffer appendBytes:([body bytes] + contentLength) length:(bodyLength - contentLength)];
            CFHTTPMessageSetBody(working, (__bridge CFDataRef)newBody);
        } else {
            CFRelease(working);
            return NO;
        }
    } else {
        return NO;
    }

    HTTPServerRequest *request = [[HTTPServerRequest alloc] initWithRequest:working connection:self];
    if (!requests) {
        requests = [[NSMutableArray alloc] init];
    }
    [requests addObject:request];
    if (delegate && [delegate respondsToSelector:@selector(HTTPConnection:didReceiveRequest:)]) {
        // Schedules the delegate to be executed later on the main thread. Cannot call the delegate
        // directly as this method is called in a loop in order to process multiple messages, and
        // the delegate may choose to stop and dealloc the listener – so we need queue the messages
        // and process them separately.
        id myDelegate = delegate;
        dispatch_async(dispatch_get_main_queue(), ^() {
          [myDelegate HTTPConnection:self didReceiveRequest:request];
        });
    } else {
        [self performDefaultRequestHandling:request];
    }

    CFRelease(working);
    return YES;
}

- (void)processOutgoingBytes {
    // The HTTP headers, then the body if any, then the response stream get
    // written out, in that order.  The Content-Length: header is assumed to
    // be properly set in the response.  Outgoing responses are processed in
    // the order the requests were received (required by HTTP).

    // Write as many bytes as possible, from buffered bytes, response
    // headers and body, and response stream.

    if (![ostream hasSpaceAvailable]) {
        return;
    }

    NSUInteger olen = [obuffer length];
    if (0 < olen) {
        NSInteger writ = [ostream write:[obuffer bytes] maxLength:olen];
        // buffer any unwritten bytes for later writing
        if (writ < olen) {
            memmove([obuffer mutableBytes], [obuffer mutableBytes] + writ, olen - writ);
            [obuffer setLength:olen - writ];
            return;
        }
        [obuffer setLength:0];
    }

    NSUInteger cnt = requests ? [requests count] : 0;
    HTTPServerRequest *req = (0 < cnt) ? [requests objectAtIndex:0] : nil;

    CFHTTPMessageRef cfresp = req ? [req response] : NULL;
    if (!cfresp) return;

    if (!obuffer) {
        obuffer = [[NSMutableData alloc] init];
    }

    if (!firstResponseDone) {
        firstResponseDone = YES;
        NSData *serialized = (__bridge_transfer NSData *)CFHTTPMessageCopySerializedMessage(cfresp);
        NSUInteger olen = [serialized length];
        if (0 < olen) {
            NSInteger writ = [ostream write:[serialized bytes] maxLength:olen];
            if (writ < olen) {
                // buffer any unwritten bytes for later writing
                [obuffer setLength:(olen - writ)];
                memmove([obuffer mutableBytes], [serialized bytes] + writ, olen - writ);
                return;
            }
        }
    }

    NSInputStream *respStream = [req responseBodyStream];
    if (respStream) {
        if ([respStream streamStatus] == NSStreamStatusNotOpen) {
            [respStream open];
        }
        // read some bytes from the stream into our local buffer
        [obuffer setLength:16 * 1024];
        NSInteger read = [respStream read:[obuffer mutableBytes] maxLength:[obuffer length]];
        [obuffer setLength:read];
    }

    if (0 == [obuffer length]) {
        // When we get to this point with an empty buffer, then the
        // processing of the response is done. If the input stream
        // is closed or at EOF, then no more requests are coming in.
        if (delegate && [delegate respondsToSelector:@selector(HTTPConnection:didSendResponse:)]) {
            [delegate HTTPConnection:self didSendResponse:req];
        }
        [requests removeObjectAtIndex:0];
        firstResponseDone = NO;
        if ([istream streamStatus] == NSStreamStatusAtEnd && [requests count] == 0) {
            [self invalidate];
        }
        return;
    }

    olen = [obuffer length];
    if (0 < olen) {
        NSInteger writ = [ostream write:[obuffer bytes] maxLength:olen];
        // buffer any unwritten bytes for later writing
        if (writ < olen) {
            memmove([obuffer mutableBytes], [obuffer mutableBytes] + writ, olen - writ);
        }
        [obuffer setLength:olen - writ];
    }
}

- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)streamEvent {
    switch(streamEvent) {
    case NSStreamEventHasBytesAvailable:;
        uint8_t buf[16 * 1024];
        uint8_t *buffer = NULL;
        NSUInteger len = 0;
        if (![istream getBuffer:&buffer length:&len]) {
            NSInteger amount = [istream read:buf maxLength:sizeof(buf)];
            buffer = buf;
            len = amount;
        }
        if (0 < len) {
            if (!ibuffer) {
                ibuffer = [[NSMutableData alloc] init];
            }
            [ibuffer appendBytes:buffer length:len];
        }
        do {} while ([self processIncomingBytes]);
        break;
    case NSStreamEventHasSpaceAvailable:;
        [self processOutgoingBytes];
        break;
    case NSStreamEventEndEncountered:;
        [self processIncomingBytes];
        if (stream == ostream) {
            // When the output stream is closed, no more writing will succeed and
            // will abandon the processing of any pending requests and further
            // incoming bytes.
            [self invalidate];
        }
        break;
    case NSStreamEventErrorOccurred:;
        NSLog(@"HTTPServer stream error: %@", [stream streamError]);
        break;
    default:
        break;
    }
}

- (void)performDefaultRequestHandling:(HTTPServerRequest *)mess {
    CFHTTPMessageRef request = [mess request];

    NSString *vers = (__bridge_transfer id)CFHTTPMessageCopyVersion(request);
    if (!vers || ![vers isEqual:(id)kCFHTTPVersion1_1]) {
        CFHTTPMessageRef response = CFHTTPMessageCreateResponse(kCFAllocatorDefault, 505, NULL, (__bridge CFStringRef)vers); // Version Not Supported
        [mess setResponse:response];
        CFRelease(response);
        return;
    }

    // 500s all requests when no delegate set to handle them.
    CFHTTPMessageRef response = CFHTTPMessageCreateResponse(kCFAllocatorDefault, 500, NULL, kCFHTTPVersion1_1); // Bad Request
    [mess setResponse:response];
    CFRelease(response);
}

@end


@implementation HTTPServerRequest

- (id)init {
    return nil;
}

- (id)initWithRequest:(CFHTTPMessageRef)req connection:(HTTPConnection *)conn {
    connection = conn;
    request = (CFHTTPMessageRef)CFRetain(req);
    return self;
}

- (void)dealloc {
    if (request) CFRelease(request);
    if (response) CFRelease(response);
}

- (HTTPConnection *)connection {
    return connection;
}

- (CFHTTPMessageRef)request {
    return request;
}

- (CFHTTPMessageRef)response {
    return response;
}

- (void)setResponse:(CFHTTPMessageRef)value {
    if (value != response) {
        if (response) CFRelease(response);
        response = (CFHTTPMessageRef)CFRetain(value);
        if (response) {
            // check to see if the response can now be sent out
            [connection processOutgoingBytes];
        }
    }
}

- (NSInputStream *)responseBodyStream {
    return responseStream;
}

- (void)setResponseBodyStream:(NSInputStream *)value {
    if (value != responseStream) {
        responseStream = value;
    }
}

@end

NSString * const TCPServerErrorDomain = @"TCPServerErrorDomain";

@implementation TCPServer

- (id)init {
    return self;
}

- (void)dealloc {
    [self stop];
}

- (id)delegate {
    return delegate;
}

- (void)setDelegate:(id)value {
    delegate = value;
}

- (NSString *)domain {
    return domain;
}

- (void)setDomain:(NSString *)value {
    if (domain != value) {
        domain = [value copy];
    }
}

- (NSString *)name {
    return name;
}

- (void)setName:(NSString *)value {
    if (name != value) {
        name = [value copy];
    }
}

- (NSString *)type {
    return type;
}

- (void)setType:(NSString *)value {
    if (type != value) {
        type = [value copy];
    }
}

- (uint16_t)port {
    return port;
}

- (void)setPort:(uint16_t)value {
    port = value;
}

- (void)handleNewConnectionFromAddress:(NSData *)addr inputStream:(NSInputStream *)istr outputStream:(NSOutputStream *)ostr {
    // if the delegate implements the delegate method, call it
    if (delegate && [(NSObject*)delegate respondsToSelector:@selector(TCPServer:didReceiveConnectionFromAddress:inputStream:outputStream:)]) {
        [delegate TCPServer:self didReceiveConnectionFromAddress:addr inputStream:istr outputStream:ostr];
    }
}

// This function is called by CFSocket when a new connection comes in.
// We gather some data here, and convert the function call to a method
// invocation on TCPServer.
static void TCPServerAcceptCallBack(CFSocketRef socket, CFSocketCallBackType type, CFDataRef address, const void *data, void *info) {
    TCPServer *server = (__bridge TCPServer *)info;
    if (kCFSocketAcceptCallBack == type) {
        // for an AcceptCallBack, the data parameter is a pointer to a CFSocketNativeHandle
        CFSocketNativeHandle nativeSocketHandle = *(CFSocketNativeHandle *)data;
        uint8_t name[SOCK_MAXADDRLEN];
        socklen_t namelen = sizeof(name);
        NSData *peer = nil;
        if (0 == getpeername(nativeSocketHandle, (struct sockaddr *)name, &namelen)) {
            peer = [NSData dataWithBytes:name length:namelen];
        }
        CFReadStreamRef readStream = NULL;
	CFWriteStreamRef writeStream = NULL;
        CFStreamCreatePairWithSocket(kCFAllocatorDefault, nativeSocketHandle, &readStream, &writeStream);
        if (readStream && writeStream) {
            CFReadStreamSetProperty(readStream, kCFStreamPropertyShouldCloseNativeSocket, kCFBooleanTrue);
            CFWriteStreamSetProperty(writeStream, kCFStreamPropertyShouldCloseNativeSocket, kCFBooleanTrue);
            [server handleNewConnectionFromAddress:peer inputStream:(__bridge NSInputStream *)readStream outputStream:(__bridge NSOutputStream *)writeStream];
        } else {
            // on any failure, need to destroy the CFSocketNativeHandle
            // since we are not going to use it any more
            close(nativeSocketHandle);
        }
        if (readStream) CFRelease(readStream);
        if (writeStream) CFRelease(writeStream);
    }
}

- (BOOL)start:(NSError **)error {
    CFSocketContext socketCtxt = {0, (__bridge void *)(self), NULL, NULL, NULL};
    ipv4socket = CFSocketCreate(kCFAllocatorDefault, PF_INET, SOCK_STREAM, IPPROTO_TCP, kCFSocketAcceptCallBack, (CFSocketCallBack)&TCPServerAcceptCallBack, &socketCtxt);
    ipv6socket = CFSocketCreate(kCFAllocatorDefault, PF_INET6, SOCK_STREAM, IPPROTO_TCP, kCFSocketAcceptCallBack, (CFSocketCallBack)&TCPServerAcceptCallBack, &socketCtxt);

    if (NULL == ipv4socket || NULL == ipv6socket) {
        if (error) *error = [[NSError alloc] initWithDomain:TCPServerErrorDomain code:kTCPServerNoSocketsAvailable userInfo:nil];
        if (ipv4socket) CFRelease(ipv4socket);
        if (ipv6socket) CFRelease(ipv6socket);
        ipv4socket = NULL;
        ipv6socket = NULL;
        return NO;
    }

    int yes = 1;
    setsockopt(CFSocketGetNative(ipv4socket), SOL_SOCKET, SO_REUSEADDR, (void *)&yes, sizeof(yes));
    setsockopt(CFSocketGetNative(ipv6socket), SOL_SOCKET, SO_REUSEADDR, (void *)&yes, sizeof(yes));

    // set up the IPv4 endpoint; if port is 0, this will cause the kernel to choose a port for us
    struct sockaddr_in addr4;
    memset(&addr4, 0, sizeof(addr4));
    addr4.sin_len = sizeof(addr4);
    addr4.sin_family = AF_INET;
    addr4.sin_port = htons(port);
    addr4.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    NSData *address4 = [NSData dataWithBytes:&addr4 length:sizeof(addr4)];

    if (kCFSocketSuccess == CFSocketSetAddress(ipv4socket, (CFDataRef)address4)) {
        if (0 == port) {
            // now that the binding was successful, we get the port number
            // -- we will need it for the v6 endpoint and for the NSNetService
            NSData *addr = (__bridge_transfer NSData *)CFSocketCopyAddress(ipv4socket);
            memcpy(&addr4, [addr bytes], [addr length]);
            port = ntohs(addr4.sin_port);
        }
    } else {
        if (ipv4socket) CFRelease(ipv4socket);
        ipv4socket = NULL;
    }

    // set up the IPv6 endpoint
    struct sockaddr_in6 addr6;
    memset(&addr6, 0, sizeof(addr6));
    addr6.sin6_len = sizeof(addr6);
    addr6.sin6_family = AF_INET6;
    addr6.sin6_port = htons(port);
    memcpy(&(addr6.sin6_addr), &in6addr_loopback, sizeof(addr6.sin6_addr));
    NSData *address6 = [NSData dataWithBytes:&addr6 length:sizeof(addr6)];

    if (kCFSocketSuccess == CFSocketSetAddress(ipv6socket, (CFDataRef)address6)) {
        if (0 == port) {
            // In this case the IPv4 socket failed to bind but the IPv6 socket succeeded
            // Get the port number of the IPv6 socket
            NSData *addr = (__bridge_transfer NSData *)CFSocketCopyAddress(ipv6socket);
            memcpy(&addr6, [addr bytes], [addr length]);
            port = ntohs(addr6.sin6_port);
        }
    } else {
        if (ipv6socket) CFRelease(ipv6socket);
        ipv6socket = NULL;
    }

    if (!ipv4socket && !ipv6socket) {
        // Couldn't bind an IPv4 or IPv6 socket, return an error
        if (error) *error = [[NSError alloc] initWithDomain:TCPServerErrorDomain code:kTCPServerCouldNotBindToIPv4Address userInfo:nil];
        return NO;
    }

    // set up the run loop sources for the sockets
    CFRunLoopRef cfrl = CFRunLoopGetCurrent();

    if (ipv4socket) {
        CFRunLoopSourceRef source4 = CFSocketCreateRunLoopSource(kCFAllocatorDefault, ipv4socket, 0);
        CFRunLoopAddSource(cfrl, source4, kCFRunLoopCommonModes);
        CFRelease(source4);
    }

    if (ipv6socket) {
        CFRunLoopSourceRef source6 = CFSocketCreateRunLoopSource(kCFAllocatorDefault, ipv6socket, 0);
        CFRunLoopAddSource(cfrl, source6, kCFRunLoopCommonModes);
        CFRelease(source6);
    }

    // we can only publish the service if we have a type to publish with
    if (nil != type) {
        NSString *publishingDomain = domain ? domain : @"";
        NSString *publishingName = nil;
        if (nil != name) {
            publishingName = name;
        } else {
            NSString * thisHostName = [[NSProcessInfo processInfo] hostName];
            if ([thisHostName hasSuffix:@".local"]) {
                publishingName = [thisHostName substringToIndex:([thisHostName length] - 6)];
            }
        }
        netService = [[NSNetService alloc] initWithDomain:publishingDomain type:type name:publishingName port:port];
        [netService publish];
    }

    return YES;
}

- (BOOL)stop {
    [netService stop];
    netService = nil;
    if (ipv4socket) {
      CFSocketInvalidate(ipv4socket);
      CFRelease(ipv4socket);
      ipv4socket = NULL;
    }
    if (ipv6socket) {
      CFSocketInvalidate(ipv6socket);
      CFRelease(ipv6socket);
      ipv6socket = NULL;
    }
    return YES;
}

- (BOOL)hasIPv4Socket {
    return ipv4socket != nil;
}

- (BOOL)hasIPv6Socket {
    return ipv6socket != nil;
}

@end

#pragma GCC diagnostic pop
