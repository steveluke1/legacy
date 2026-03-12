import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Check failed attempts in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const attempts = await base44.asServiceRole.entities.LoginLog.filter({
      username: email,
      result: 'FAILED'
    });

    // Filter by time (created_date in last 10 minutes)
    const recentFailedAttempts = attempts.filter(log => {
      const logDate = new Date(log.created_date);
      return logDate > tenMinutesAgo;
    });

    const isBlocked = recentFailedAttempts.length >= 6;

    return Response.json({
      success: true,
      is_blocked: isBlocked,
      failed_attempts: recentFailedAttempts.length,
      remaining_attempts: Math.max(0, 6 - recentFailedAttempts.length)
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});