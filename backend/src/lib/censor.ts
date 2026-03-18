export function censorName(name: string): string {
    if (name.length === 1) {
        return `${name}**`;
    }

    if (name.length === 2) {
        return `${name[0]}*`;
    }

    return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
}

export function censorNameForViewer(name: string, viewerSupplierId: string, bidSupplierId: string): string {
    if (viewerSupplierId === bidSupplierId) {
        return name;
    }

    return censorName(name);
}
