/*! @file OIDLoopbackHTTPServer.h
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

// Based on the MiniSOAP Sample
// https://developer.apple.com/library/mac/samplecode/MiniSOAP/Introduction/Intro.html
// Modified to limit connections to the loopback interface only.

#import <Foundation/Foundation.h>
#import <CoreServices/CoreServices.h>

@class HTTPConnection, HTTPServerRequest, TCPServer;

extern NSString * const TCPServerErrorDomain;

typedef enum {
    kTCPServerCouldNotBindToIPv4Address = 1,
    kTCPServerCouldNotBindToIPv6Address = 2,
    kTCPServerNoSocketsAvailable = 3,
} TCPServerErrorCode;

@protocol TCPServerDelegate <NSObject>

- (void)TCPServer:(TCPServer *)server
    didReceiveConnectionFromAddress:(NSData *)addr
                        inputStream:(NSInputStream *)istr
                       outputStream:(NSOutputStream *)ostr;

@end

@interface TCPServer : NSObject {
@private
    __weak id<TCPServerDelegate> delegate;
    NSString *domain;
    NSString *name;
    NSString *type;
    uint16_t port;
    CFSocketRef ipv4socket;
    CFSocketRef ipv6socket;
    NSNetService *netService;
}

- (id)delegate;
- (void)setDelegate:(id)value;

- (NSString *)domain;
- (void)setDomain:(NSString *)value;

- (NSString *)name;
- (void)setName:(NSString *)value;

- (NSString *)type;
- (void)setType:(NSString *)value;

- (uint16_t)port;
- (void)setPort:(uint16_t)value;

- (BOOL)start:(NSError **)error;
- (BOOL)stop;

- (BOOL)hasIPv4Socket;
- (BOOL)hasIPv6Socket;

// called when a new connection comes in; by default, informs the delegate
- (void)handleNewConnectionFromAddress:(NSData *)addr
                           inputStream:(NSInputStream *)istr
                          outputStream:(NSOutputStream *)ostr;

@end

@interface HTTPServer : TCPServer {
@private
    Class connClass;
    NSURL *docRoot;
    // Currently active connections spawned from the HTTPServer.
    NSMutableArray<HTTPConnection *> *connections;
}

- (Class)connectionClass;
// used to configure the subclass of HTTPConnection to create when 
// a new connection comes in; by default, this is HTTPConnection
- (void)setConnectionClass:(Class)value;

@end

@interface HTTPServer (HTTPServerDelegateMethods)
// If the delegate implements this method, this is called 
// by an HTTPServer when a new connection comes in.  If the
// delegate wishes to refuse the connection, then it should
// invalidate the connection object from within this method.
- (void)HTTPServer:(HTTPServer *)serv didMakeNewConnection:(HTTPConnection *)conn;
@end


// This class represents each incoming client connection.
@interface HTTPConnection : NSObject <NSStreamDelegate> {
@private
    __weak id delegate;
    NSData *peerAddress;
    __weak HTTPServer *server;
    NSMutableArray<HTTPServerRequest *> *requests;
    NSInputStream *istream;
    NSOutputStream *ostream;
    NSMutableData *ibuffer;
    NSMutableData *obuffer;
    BOOL isValid;
    BOOL firstResponseDone;
}

- (id)initWithPeerAddress:(NSData *)addr
              inputStream:(NSInputStream *)istr
             outputStream:(NSOutputStream *)ostr
                forServer:(HTTPServer *)serv;

- (id)delegate;
- (void)setDelegate:(id)value;

- (NSData *)peerAddress;

- (HTTPServer *)server;

// get the next request that needs to be responded to
- (HTTPServerRequest *)nextRequest;

- (BOOL)isValid;
// shut down the connection
- (void)invalidate;

// perform the default handling action: GET and HEAD requests for files
// in the local file system (relative to the documentRoot of the server)
- (void)performDefaultRequestHandling:(HTTPServerRequest *)sreq;

@end

@interface HTTPConnection (HTTPConnectionDelegateMethods)
// The "didReceiveRequest:" tells the delegate when a new request comes in.
- (void)HTTPConnection:(HTTPConnection *)conn didReceiveRequest:(HTTPServerRequest *)mess;
- (void)HTTPConnection:(HTTPConnection *)conn didSendResponse:(HTTPServerRequest *)mess;
@end


// As NSURLRequest and NSURLResponse are not entirely suitable for use from
// the point of view of an HTTP server, we use CFHTTPMessageRef to encapsulate
// requests and responses.  This class packages the (future) response with a
// request and other info for convenience.
@interface HTTPServerRequest : NSObject {
@private
    HTTPConnection *connection;
    CFHTTPMessageRef request;
    CFHTTPMessageRef response;
    NSInputStream *responseStream;
}

- (id)initWithRequest:(CFHTTPMessageRef)req connection:(HTTPConnection *)conn;

- (HTTPConnection *)connection;

- (CFHTTPMessageRef)request;

// The response may include a body.  As soon as the response is set,
// the response may be written out to the network.
- (CFHTTPMessageRef)response;
- (void)setResponse:(CFHTTPMessageRef)value;

- (NSInputStream *)responseBodyStream;
// If there is to be a response body stream (when, say, a big
// file is to be returned, rather than reading the whole thing
// into memory), then it must be set on the request BEFORE the
// response [headers] itself.
- (void)setResponseBodyStream:(NSInputStream *)value;

@end


