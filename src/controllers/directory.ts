import { User } from '../models/user.js';
import { Device } from '../models/device.js';

// Get all extensions in the directory
export async function getDirectory(ctx: any) {
  try {
    const users = await User.find({}, 'name email extension phone avatar publicKey').lean();
    
    // Fetch current online status for each user
    const userIds = users.map(u => u._id);
    const devices = await Device.find({ userId: { $in: userIds } }, 'userId status').lean();
    
    // Map status to user directory
    const statusMap = new Map<string, string>();
    devices.forEach(d => {
      // If any of the user's devices is online/busy/dnd, show that status
      const userIdStr = d.userId.toString();
      const currentStatus = statusMap.get(userIdStr);
      if (d.status === 'online' && currentStatus !== 'busy') {
        statusMap.set(userIdStr, 'online');
      } else if (d.status === 'busy') {
        statusMap.set(userIdStr, 'busy');
      } else if (d.status === 'dnd' && !currentStatus) {
        statusMap.set(userIdStr, 'dnd');
      } else if (!currentStatus) {
        statusMap.set(userIdStr, 'offline');
      }
    });

    const directory = users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      extension: u.extension,
      phone: u.phone || '',
      avatar: u.avatar,
      publicKey: u.publicKey || null,
      status: statusMap.get(u._id.toString()) || 'offline'
    }));

    return { success: true, directory };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Search extensions by query
export async function searchDirectory(ctx: any) {
  const query = ctx.query.q || '';

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { extension: { $regex: query, $options: 'i' } }
      ]
    }, 'name email extension avatar publicKey').lean();

    return { success: true, results: users };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Upload/Update E2E Cryptography Public Key
export async function uploadPublicKey(ctx: any) {
  const userId = ctx.state.user?.id;
  const { publicKey } = ctx.body;

  if (!userId) {
    ctx.status(401);
    return { success: false, message: 'Unauthorized' };
  }

  if (!publicKey) {
    ctx.status(400);
    return { success: false, message: 'Public key is required' };
  }

  try {
    await User.findByIdAndUpdate(userId, { publicKey });
    return { success: true, message: 'E2E Public Key updated successfully' };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Get another user's E2E Public Key
export async function getPublicKey(ctx: any) {
  const { targetUserId } = ctx.params;

  if (!targetUserId) {
    ctx.status(400);
    return { success: false, message: 'Target user ID is required' };
  }

  try {
    const user = await User.findById(targetUserId, 'publicKey').lean();
    if (!user) {
      ctx.status(404);
      return { success: false, message: 'User not found' };
    }

    return { success: true, publicKey: user.publicKey || null };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}
