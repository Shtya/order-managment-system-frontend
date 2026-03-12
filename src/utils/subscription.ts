

/**
 * Finds and returns the active subscription object from a user.
 */
export const getActiveSubscription = (user: any): any | null => {
    // 1. Check for the flat mapped property first
    if (user?.subscription?.status === 'active') {
        return user.subscription;
    }

    // 2. Search through the subscriptions array
    if (Array.isArray(user?.subscriptions)) {
        return user.subscriptions.find((sub: any) => sub.status === 'active') || null;
    }

    return null;
};