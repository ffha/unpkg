import { parse } from 'es-module-lexer/js';

const origin = 'https://unpkg.com';

const bareIdentifierFormat = /^((?:@[^/]+\/)?[^/]+)(\/.*)?$/;

function isValidURL(value) {
    try {
        new URL(value);
        return true;
    } catch (e) {
        return false;
    }
}

function isProbablyURLWithoutProtocol(value) {
    return value.substr(0, 2) === '//';
}

function isAbsoluteURL(value) {
    return isValidURL(value) || isProbablyURLWithoutProtocol(value);
}

function isBareIdentifier(value) {
    return value.charAt(0) !== '.' && value.charAt(0) !== '/';
}

export function insert(currentString, start, insertedString, delCount) {
  return currentString.slice(0, start) + insertedString + currentString.slice(start + Math.abs(delCount));
}

export function rewriteBareModuleIdentifiers(code, packageConfig) {
  const dependencies = Object.assign(
    {},
    packageConfig.peerDependencies,
    packageConfig.dependencies
  );
  let additionalIndex = 0;
  const [imports] = parse(code);
  for (const _import of imports) {
    if (_import.a === -1) {
      const oldIdentifierLength = _import.n.length;
      let identifier = _import.n;
      let originIdentifierLength = identifier.length
      if (isAbsoluteURL(identifier)) {
        continue;
      }

      if (isBareIdentifier(identifier)) {
        const match = bareIdentifierFormat.exec(identifier);
        const packageName = match[1];
        const file = match[2] || '';

        const version = dependencies[packageName] || 'latest';

        identifier = `${origin}/${packageName}@${version}${file}?module`;
      } else {
        // local path
        identifier = `${identifier}?module`;
      }

      code = insert(code, _import.s + additionalIndex, identifier, oldIdentifierLength);
      additionalIndex += (identifier.length - originIdentifierLength);
    }
  }
  return code;
}
