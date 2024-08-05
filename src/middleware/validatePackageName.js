import validateNpmPackageName from 'validate-npm-package-name';

const hexValue = /^[a-f0-9]+$/i;

function isHash(value) {
  return value.length === 32 && hexValue.test(value);
}

/**
 * Reject requests for invalid npm package names.
 */
export async function validatePackageName(c, next) {
  if (isHash(c.var.packageName)) {
    return c.text(`Invalid package name "${c.var.packageName}" (cannot be a hash)`, 403);
  }

  const errors = validateNpmPackageName(c.var.packageName).errors;

  if (errors) {
    const reason = errors.join(', ');

    return c.text(`Invalid package name "${c.var.packageName}" (${reason})`, 403);
  }

  await next();
}
