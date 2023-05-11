export function toType(type) {
  switch (type) {
    case "0":
      return "file";
    case "1":
      return "link";
    case "2":
      return "symlink";
    case "3":
      return "character-device";
    case "4":
      return "block-device";
    case "5":
      return "directory";
    case "6":
      return "fifo";
    case "7":
      return "contiguous-file";
    case "72":
      return "pax-header";
    case "55":
      return "pax-global-header";
    case "27":
      return "gnu-long-link-path";
    case "28":
    case "30":
      return "gnu-long-path";
  }
  return null;
}
