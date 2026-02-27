
export function tenantId(me) {
    if (!me) return null;

    const roleName = me.role;
    if (roleName === 'super_admin') return null;
    if (roleName === 'admin') return me.id;

    return me.adminId;
}