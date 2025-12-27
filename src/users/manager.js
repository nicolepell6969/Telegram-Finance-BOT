const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../../data/users.json');

class UserManager {
    constructor() {
        this.users = [];
        this.loadUsers();
    }

    /**
     * Load users from JSON file
     */
    loadUsers() {
        try {
            if (fs.existsSync(USERS_FILE)) {
                const data = fs.readFileSync(USERS_FILE, 'utf8');
                const parsed = JSON.parse(data);
                this.users = parsed.users || [];
            } else {
                // Initialize empty users file
                this.saveUsers();
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
        }
    }

    /**
     * Save users to JSON file
     */
    saveUsers() {
        try {
            const dir = path.dirname(USERS_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(USERS_FILE, JSON.stringify({ users: this.users }, null, 2));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    /**
     * Register new user
     */
    registerUser(userId, name, role = 'member') {
        // Convert userId to string for consistency
        const userIdStr = String(userId);

        // Check if user already exists
        if (this.users.find(u => String(u.userId) === userIdStr)) {
            return { success: false, message: 'User already registered' };
        }

        // First user becomes admin
        const isFirstUser = this.users.length === 0;
        const userRole = isFirstUser ? 'admin' : role;

        const newUser = {
            userId: userIdStr,
            name: name || 'User',
            role: userRole,
            joinedAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();

        return {
            success: true,
            isFirstUser,
            role: userRole,
            message: isFirstUser ? 'Registered as admin' : 'Registered as member'
        };
    }

    /**
     * Check if user is authorized
     */
    isAuthorized(userId) {
        const userIdStr = String(userId);
        return this.users.some(u => String(u.userId) === userIdStr);
    }

    /**
     * Check if user is admin
     */
    isAdmin(userId) {
        const userIdStr = String(userId);
        const user = this.users.find(u => String(u.userId) === userIdStr);
        return user && user.role === 'admin';
    }

    /**
     * Get user by ID
     */
    getUser(userId) {
        const userIdStr = String(userId);
        return this.users.find(u => String(u.userId) === userIdStr);
    }

    /**
     * Get user display name
     */
    getUserName(userId) {
        const user = this.getUser(userId);
        return user ? user.name : 'Unknown';
    }

    /**
     * Add member (admin only)
     */
    addMember(adminId, userId, name) {
        if (!this.isAdmin(adminId)) {
            return { success: false, message: 'Only admins can add members' };
        }

        return this.registerUser(userId, name, 'member');
    }

    /**
     * Remove member (admin only)
     */
    removeMember(adminId, userId) {
        const adminIdStr = String(adminId);
        const userIdStr = String(userId);

        if (!this.isAdmin(adminIdStr)) {
            return { success: false, message: 'Only admins can remove members' };
        }

        // Cannot remove yourself
        if (adminIdStr === userIdStr) {
            return { success: false, message: 'Cannot remove yourself' };
        }

        const index = this.users.findIndex(u => String(u.userId) === userIdStr);
        if (index === -1) {
            return { success: false, message: 'User not found' };
        }

        const removedUser = this.users[index];
        this.users.splice(index, 1);
        this.saveUsers();

        return {
            success: true,
            message: `Removed ${removedUser.name}`,
            removedUser
        };
    }

    /**
     * Get all users
     */
    getUsers() {
        return this.users.map(u => ({
            userId: u.userId,
            name: u.name,
            role: u.role,
            joinedAt: u.joinedAt
        }));
    }

    /**
     * Get admin users
     */
    getAdmins() {
        return this.users.filter(u => u.role === 'admin');
    }

    /**
     * Update user name
     */
    updateUserName(userId, newName) {
        const userIdStr = String(userId);
        const user = this.users.find(u => String(u.userId) === userIdStr);

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        user.name = newName;
        this.saveUsers();

        return { success: true, message: 'Name updated' };
    }

    /**
     * Get user count
     */
    getUserCount() {
        return this.users.length;
    }
}

// Export singleton instance
module.exports = new UserManager();
