import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const role = url.searchParams.get('role');

    let sentQuery = { from_user_id: user.id };
    let receivedQuery = { to_user_id: user.id };

    if (type) {
      sentQuery.type = type;
      receivedQuery.type = type;
    }

    const sent = role === 'RECEIVER' ? [] : await base44.asServiceRole.entities.TransferRequest.filter(sentQuery);
    const received = role === 'SENDER' ? [] : await base44.asServiceRole.entities.TransferRequest.filter(receivedQuery);

    return Response.json({
      success: true,
      sent,
      received
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});