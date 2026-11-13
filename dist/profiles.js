export const PROFILES = Object.fromEntries(Array.from({ length: 128 }, (_, i) => [`dv${i + 1}`, { port: 9230 + i }]));
export function getProfile(name) {
    return Object.prototype.hasOwnProperty.call(PROFILES, name) ? PROFILES[name] : undefined;
}
export function getProfileByPort(port) {
    return Object.entries(PROFILES).find(([_, config]) => config.port === port);
}
export function listProfiles() {
    return Object.entries(PROFILES).map(([name, config]) => ({
        name,
        port: config.port,
    }));
}
//# sourceMappingURL=profiles.js.map