import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch only active packages
    const packages = await base44.entities.StreamerPackage.filter(
      { is_active: true },
      '-sort_order',
      50
    );

    // Return minimal payload
    const publicPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      items: pkg.items,
      price_cash: pkg.price_cash,
      image_url: pkg.image_url,
      sort_order: pkg.sort_order || 0
    }));

    return Response.json({
      success: true,
      packages: publicPackages
    });

  } catch (error) {
    console.error('List public streamer packages error:', error);
    return Response.json({
      success: false,
      error: 'Erro ao carregar pacotes',
      packages: []
    }, { status: 500 });
  }
});