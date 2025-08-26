export async function GET() {
    const menus = [
      {
        id: "1",
        name: "Dashboard",
        items: [
          { id: "1-1", title: "Overview", href: "/overview" },
          { id: "1-2", title: "Stats", href: "/stats" },
        ],
      },
      {
        id: "2",
        name: "Projects",
        items: [
          { id: "2-1", title: "Project 1", href: "/projects/1" },
          { id: "2-2", title: "Project 2", href: "/projects/2" },
        ],
      },
    ];
  
    return new Response(JSON.stringify(menus), {
      headers: { "Content-Type": "application/json" },
    });
  }
