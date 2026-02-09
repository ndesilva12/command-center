import { NextRequest, NextResponse } from "next/server";

// In-memory storage for now (will be replaced with Notion integration)
const tasks: Array<{
  id: string;
  title: string;
  date: string;
  status: "completed" | "in-progress";
  preview: string;
  content?: string;
}> = [];

export async function GET() {
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newTask = {
      id: Date.now().toString(),
      title: body.title || "Untitled Task",
      date: new Date().toISOString(),
      status: body.status || "in-progress",
      preview: body.preview || "",
      content: body.content || "",
    };

    tasks.push(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const index = tasks.findIndex((t) => t.id === body.id);

    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    tasks[index] = { ...tasks[index], ...body };
    return NextResponse.json(tasks[index]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    tasks.splice(index, 1);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
