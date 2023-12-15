// TableCell.tsx
import React from "react";

interface TableCellProps {
  value: number | undefined;
  fixed?: number;
}

const TableCell: React.FC<TableCellProps> = ({ value, fixed = 2 }) => (
  <td className="py-1 px-4 border-b">{value?.toFixed(fixed) ?? 0}</td>
);

export default TableCell;
