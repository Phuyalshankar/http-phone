import mongoose from 'mongoose';
import { Message } from '../models/message.js';
import { Group } from '../models/group.js';
import { User } from '../models/user.js';
import { Device } from '../models/device.js';
import { rt, sendPushToUser } from '../realtime/realtime.js';

// Get list of direct chat conversations for the current user
export async function getConversations(ctx: any) {
  const userId = ctx.state.user?.id;
  if (!userId) {
    ctx.status(401);
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Aggregate to find last message for each distinct chat partner
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userObjId },
            { receiverId: userObjId }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userObjId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partner'
        }
      },
      { $unwind: '$partner' },
      {
        $project: {
          _id: 0,
          partner: {
            id: '$partner._id',
            name: '$partner.name',
            extension: '$partner.extension',
            avatar: '$partner.avatar'
          },
          lastMessage: {
            id: '$lastMessage._id',
            content: '$lastMessage.content',
            type: '$lastMessage.type',
            createdAt: '$lastMessage.createdAt',
            senderId: '$lastMessage.senderId',
            readBy: '$lastMessage.readBy'
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    return { success: true, conversations };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Get message history for direct chat with another user
export async function getDirectChatHistory(ctx: any) {
  const userId = ctx.state.user?.id;
  const { targetUserId } = ctx.params;
  const limit = parseInt(ctx.query.limit || '50');
  const before = ctx.query.before; // For pagination

  if (!userId || !targetUserId) {
    ctx.status(400);
    return { success: false, message: 'Missing parameters' };
  }

  try {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const targetObjId = new mongoose.Types.ObjectId(targetUserId);

    const query: any = {
      $or: [
        { senderId: userObjId, receiverId: targetObjId },
        { senderId: targetObjId, receiverId: userObjId }
      ]
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Reverse to chronological order
    messages.reverse();

    // Map _id to id
    const formattedMessages = messages.map((m: any) => {
      m.id = m._id.toString();
      delete m._id;
      return m;
    });

    return { success: true, messages: formattedMessages };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Get message history for a group
export async function getGroupChatHistory(ctx: any) {
  const userId = ctx.state.user?.id;
  const { groupId } = ctx.params;
  const limit = parseInt(ctx.query.limit || '50');
  const before = ctx.query.before;

  if (!userId || !groupId) {
    ctx.status(400);
    return { success: false, message: 'Missing parameters' };
  }

  try {
    const groupObjId = new mongoose.Types.ObjectId(groupId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Verify user is a member of the group
    const isMember = await Group.findOne({ _id: groupObjId, members: userObjId });
    if (!isMember) {
      ctx.status(403);
      return { success: false, message: 'You are not a member of this group' };
    }

    const query: any = { groupId: groupObjId };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'name extension avatar')
      .lean();

    messages.reverse();

    const formattedMessages = messages.map((m: any) => {
      m.id = m._id.toString();
      delete m._id;
      if (m.senderId) {
        m.sender = {
          id: m.senderId._id.toString(),
          name: m.senderId.name,
          extension: m.senderId.extension,
          avatar: m.senderId.avatar
        };
        delete m.senderId;
      }
      return m;
    });

    return { success: true, messages: formattedMessages };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Create chat group
export async function createGroup(ctx: any) {
  const userId = ctx.state.user?.id;
  const { name, description, members = [] } = ctx.body;

  if (!userId || !name) {
    ctx.status(400);
    return { success: false, message: 'Group name is required' };
  }

  try {
    const adminObjId = new mongoose.Types.ObjectId(userId);
    const memberObjIds = members.map((m: string) => new mongoose.Types.ObjectId(m));

    // Admin is automatically a member
    if (!memberObjIds.some((m: mongoose.Types.ObjectId) => m.equals(adminObjId))) {
      memberObjIds.push(adminObjId);
    }

    const group = await Group.create({
      name,
      description,
      adminId: adminObjId,
      members: memberObjIds
    });

    return {
      success: true,
      message: 'Group created successfully',
      group: {
        id: group._id.toString(),
        name: group.name,
        description: group.description,
        adminId: group.adminId,
        members: group.members
      }
    };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Get list of groups the current user is in
export async function getGroups(ctx: any) {
  const userId = ctx.state.user?.id;
  if (!userId) {
    ctx.status(401);
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const groups = await Group.find({ members: userObjId })
      .populate('members', 'name extension avatar')
      .lean();

    const formattedGroups = groups.map((g: any) => {
      g.id = g._id.toString();
      delete g._id;
      g.members = g.members.map((m: any) => ({
        id: m._id.toString(),
        name: m.name,
        extension: m.extension,
        avatar: m.avatar
      }));
      return g;
    });

    return { success: true, groups: formattedGroups };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Add members to a group
export async function addGroupMembers(ctx: any) {
  const userId = ctx.state.user?.id;
  const { groupId } = ctx.params;
  const { members } = ctx.body; // Array of user IDs

  if (!userId || !groupId || !members || !members.length) {
    ctx.status(400);
    return { success: false, message: 'Invalid arguments' };
  }

  try {
    const groupObjId = new mongoose.Types.ObjectId(groupId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Verify that the caller is the group admin
    const group = await Group.findById(groupObjId);
    if (!group) {
      ctx.status(404);
      return { success: false, message: 'Group not found' };
    }

    if (group.adminId.toString() !== userId) {
      ctx.status(403);
      return { success: false, message: 'Only group admin can add members' };
    }

    const memberObjIds = members.map((m: string) => new mongoose.Types.ObjectId(m));
    
    // Add unique members
    await Group.findByIdAndUpdate(groupObjId, {
      $addToSet: { members: { $each: memberObjIds } }
    });

    return { success: true, message: 'Members added successfully' };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Leave group
export async function leaveGroup(ctx: any) {
  const userId = ctx.state.user?.id;
  const { groupId } = ctx.params;

  if (!userId || !groupId) {
    ctx.status(400);
    return { success: false, message: 'Missing parameters' };
  }

  try {
    const groupObjId = new mongoose.Types.ObjectId(groupId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    const group = await Group.findById(groupObjId);
    if (!group) {
      ctx.status(404);
      return { success: false, message: 'Group not found' };
    }

    // Remove user from members
    await Group.findByIdAndUpdate(groupObjId, {
      $pull: { members: userObjId }
    });

    // If admin leaves, assign new admin or delete if no members left
    if (group.adminId.toString() === userId) {
      const updatedGroup = await Group.findById(groupObjId);
      if (updatedGroup && updatedGroup.members.length > 0) {
        // Assign first member as the new admin
        await Group.findByIdAndUpdate(groupObjId, {
          adminId: updatedGroup.members[0]
        });
      } else {
        // Delete group if empty
        await Group.findByIdAndDelete(groupObjId);
      }
    }

    return { success: true, message: 'You left the group successfully' };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Send a direct message (text or file) and trigger offline push
export async function sendDirectMessage(ctx: any) {
  const userId = ctx.state.user?.id;
  const { targetUserId } = ctx.params;
  const { content, type = 'text', mediaUrl, mediaName, mediaSize, iv } = ctx.body;

  if (!userId || !targetUserId || !content) {
    ctx.status(400);
    return { success: false, message: 'Sender, receiver, and content are required' };
  }

  try {
    const senderObjId = new mongoose.Types.ObjectId(userId);
    const receiverObjId = new mongoose.Types.ObjectId(targetUserId);

    // 1. Save message to database
    const message = await Message.create({
      senderId: senderObjId,
      receiverId: receiverObjId,
      content,
      type,
      mediaUrl,
      mediaName,
      mediaSize,
      iv
    });

    const formattedMessage = {
      id: message._id.toString(),
      senderId: userId,
      receiverId: targetUserId,
      content,
      type,
      mediaUrl,
      mediaName,
      mediaSize,
      iv,
      createdAt: message.createdAt
    };

    // 2. Publish to websocket topics
    rt.publish(`chat/private/${targetUserId}`, formattedMessage);
    rt.publish(`chat/private/${userId}`, formattedMessage); // Sync sender devices

    // 3. Send push notification if recipient is offline
    const recipientDevices = await Device.find({ userId: targetUserId, status: 'online' });
    const isOnline = recipientDevices.length > 0;

    if (!isOnline) {
      const sender = await User.findById(userId, 'name extension');
      const senderName = sender?.name || sender?.extension || 'Intercom User';
      
      const title = `Incoming Message from ${senderName}`;
      const body = type === 'file' ? `[Attachment] ${mediaName || 'File'}` : content;
      
      await sendPushToUser(targetUserId, { title, body }, {
        type: 'new_message',
        senderId: userId,
        messageId: message._id.toString()
      });
    }

    ctx.status(201);
    return { success: true, message: formattedMessage };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

// Send a group message (text or file) and trigger offline push for offline members
export async function sendGroupMessage(ctx: any) {
  const userId = ctx.state.user?.id;
  const { groupId } = ctx.params;
  const { content, type = 'text', mediaUrl, mediaName, mediaSize, iv } = ctx.body;

  if (!userId || !groupId || !content) {
    ctx.status(400);
    return { success: false, message: 'Sender, group, and content are required' };
  }

  try {
    const senderObjId = new mongoose.Types.ObjectId(userId);
    const groupObjId = new mongoose.Types.ObjectId(groupId);

    // Verify user is a member of the group
    const group = await Group.findOne({ _id: groupObjId, members: senderObjId });
    if (!group) {
      ctx.status(403);
      return { success: false, message: 'You are not a member of this group' };
    }

    // 1. Save message to database
    const message = await Message.create({
      senderId: senderObjId,
      groupId: groupObjId,
      content,
      type,
      mediaUrl,
      mediaName,
      mediaSize,
      iv
    });

    const sender = await User.findById(userId, 'name extension avatar').lean();
    
    const formattedMessage = {
      id: message._id.toString(),
      sender: {
        id: userId,
        name: sender?.name || '',
        extension: sender?.extension || '',
        avatar: sender?.avatar || ''
      },
      groupId,
      content,
      type,
      mediaUrl,
      mediaName,
      mediaSize,
      iv,
      createdAt: message.createdAt
    };

    // 2. Publish to websocket topic
    rt.publish(`chat/group/${groupId}`, formattedMessage);

    // 3. Send push notifications to all offline members
    const senderName = sender?.name || sender?.extension || 'Group Member';
    const pushTitle = `${group.name} - ${senderName}`;
    const pushBody = type === 'file' ? `[Attachment] ${mediaName || 'File'}` : content;

    for (const memberId of group.members) {
      if (memberId.toString() === userId) continue; // Skip sender

      const memberDevices = await Device.find({ userId: memberId, status: 'online' });
      const isOnline = memberDevices.length > 0;

      if (!isOnline) {
        await sendPushToUser(memberId.toString(), { title: pushTitle, body: pushBody }, {
          type: 'group_message',
          groupId,
          messageId: message._id.toString()
        });
      }
    }

    ctx.status(201);
    return { success: true, message: formattedMessage };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}
