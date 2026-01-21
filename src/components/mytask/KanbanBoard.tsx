"use client";

import { useState } from "react";
import { Board } from "./Board";
import { dummyBoard, Board as BoardType } from "./dummy-data";

export function KanbanBoard() {
  const [board, setBoard] = useState<BoardType>(dummyBoard);

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* Board Header - Compact */}
      <div className="border-b bg-app-card px-6 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-app-heading">
            {board.title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{board.columns.length} columns</span>
            <span>•</span>
            <span>
              {board.columns.reduce((acc, col) => acc + col.tasks.length, 0)}{" "}
              tasks
            </span>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <Board
        columns={board.columns}
        onColumnsChange={(newColumns) =>
          setBoard({ ...board, columns: newColumns })
        }
      />
    </div>
  );
}
