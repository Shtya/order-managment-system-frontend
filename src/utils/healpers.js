
export function tenantId(me) {
    if (!me) return null;

    const roleName = typeof me.role === 'string' ? me.role : me.role?.name;
    if (roleName === 'super_admin') return null;
    if (roleName === 'admin') return me.id;

    return me.adminId;
}


export const platformCurrency = `${process.env.NEXT_PUBLIC_PLATFOMR_CURRENCY}`;