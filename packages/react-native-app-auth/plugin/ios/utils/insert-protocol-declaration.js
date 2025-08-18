const insertProtocolDeclaration = ({
  source,
  interfaceName,
  protocolName,
  baseClassName = 'NSObject',
}) => {
  const matchInterfaceDeclarationRegexp = new RegExp(
    `(@interface\\s+${interfaceName}\\s*:\\s*${baseClassName})(\\s*\\<(.*)\\>)?`
  );
  const match = source.match(matchInterfaceDeclarationRegexp);
  if (match) {
    const [line, interfaceDeclaration, , existingProtocols] = match;
    if (!existingProtocols || !existingProtocols.includes(protocolName)) {
      source = source.replace(
        line,
        `${interfaceDeclaration} <${
          existingProtocols ? `${existingProtocols},` : ''
        }${protocolName}>`
      );
    }
  }

  return source;
};

module.exports = {
  insertProtocolDeclaration,
};
