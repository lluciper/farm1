// Only the platform dispatcher can supply verified identity headers.
export const OWNER_EMAIL='tu.vinhomes.97@gmail.com';
export function isOwner(user:{userId:string;email:string}|null){return !!user?.userId&&user.email.toLowerCase()===OWNER_EMAIL}
