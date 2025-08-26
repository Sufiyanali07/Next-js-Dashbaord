"use client";

import { useSidebar } from "@/components/ui/sidebar";

export default function CustomToggleButton() {
  const { toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Toggle Sidebar
    </button>
  );
}
