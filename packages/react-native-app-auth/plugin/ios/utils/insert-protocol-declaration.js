/**
 * Inserts a protocol into an Objective-C class interface declaration.
 * @param {string} source source code of the file
 * @param {string} interfaceName Name of the interface to insert the protocol into (ex: AppDelegate)
 * @param {string} protocolName Name of the protocol to add to the list of protocols (ex: RNAppAuthAuthorizationFlowManagerDelegate)
 * @param {string|undefined} baseClassName Base class name of the interface (ex: NSObject)
 * @returns {string} the patched source code
 */
const insertProtocolDeclaration = ({
	source,
	interfaceName,
	protocolName,
	baseClassName = 'NSObject',
}) => {
	const matchInterfaceDeclarationRegexp = new RegExp(
		`(@interface\\s+${interfaceName}\\s*:\\s*${baseClassName})(\\s*\\<(.*)\\>)?`,
	);
	const match = source.match(matchInterfaceDeclarationRegexp);
	if (match) {
		const [line, interfaceDeclaration, , existingProtocols] = match;
		if (!existingProtocols || !existingProtocols.includes(protocolName)) {
			source = source.replace(
				line,
				`${interfaceDeclaration} <${
					existingProtocols ? `${existingProtocols},` : ''
				}${protocolName}>`,
			);
		}
	}

	return source;
};

module.exports = {
	insertProtocolDeclaration,
};
