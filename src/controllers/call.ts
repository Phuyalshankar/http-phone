import { CallLog } from '../models/callLog.js';
import { User } from '../models/user.js';

export async function startCall(ctx: any) {
  const { callLogId, callerExt, receiverExt } = ctx.body;
  if (!callLogId || !callerExt || !receiverExt) {
    ctx.status(400);
    return { success: false, message: 'Missing fields: callLogId, callerExt, receiverExt' };
  }

  try {
    const caller = await User.findOne({ extension: callerExt });
    const receiver = await User.findOne({ extension: receiverExt });

    const callLog = new CallLog({
      callLogId,
      callerExt,
      receiverExt,
      callerName: caller ? caller.name : '',
      receiverName: receiver ? receiver.name : '',
      startTime: new Date(),
      status: 'connected'
    });

    await callLog.save();

    ctx.status(201);
    return { success: true, callLog };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

export async function endCall(ctx: any) {
  const { callLogId, duration } = ctx.body;
  if (!callLogId) {
    ctx.status(400);
    return { success: false, message: 'Missing callLogId' };
  }

  try {
    const callLog = await CallLog.findOne({ callLogId });
    if (!callLog) {
      ctx.status(404);
      return { success: false, message: 'Call log not found' };
    }

    callLog.endTime = new Date();
    callLog.duration = duration || 0;
    callLog.status = 'completed';
    await callLog.save();

    return { success: true, callLog };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}

export async function getCallHistory(ctx: any) {
  const user = ctx.state.user;
  if (!user || !user.id) {
    ctx.status(401);
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const dbUser = await User.findById(user.id);
    if (!dbUser) {
      ctx.status(404);
      return { success: false, message: 'User not found' };
    }

    const ext = dbUser.extension;
    const history = await CallLog.find({
      $or: [{ callerExt: ext }, { receiverExt: ext }]
    }).sort({ createdAt: -1 }).limit(50);

    return { success: true, history };
  } catch (error: any) {
    ctx.status(500);
    return { success: false, message: error.message };
  }
}
