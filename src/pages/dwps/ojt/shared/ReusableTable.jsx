// src/pages/dwps/ojt/shared/ReusableTable.jsx
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import { TABLE_STYLE } from "./constants";
import { reusableTablePropTypes } from "./propTypes";

export const ReusableTable = ({
  columns,
  data,
  page,
  rowsPerPage,
  loading,
  actions,
  emptyMessage = "No data found",
}) => (
  <TableContainer component={Paper} elevation={1}>
    <Table size="small" sx={TABLE_STYLE}>
      <TableHead>
        <TableRow>
          <TableCell>#</TableCell>
          {columns.map((col) => (
            <TableCell key={col.id}>{col.label}</TableCell>
          ))}
          {actions && <TableCell>Actions</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.length > 0 ? (
          data
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1 + page * rowsPerPage}</TableCell>
                {columns.map((col) => (
                  <TableCell key={col.id}>
                    {col.render ? col.render(item) : item[col.field] || "N/A"}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell>
                    {actions.map((action) => (
                      <Tooltip key={action.id} title={action.tooltip}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => action.onClick(item)}
                            color={action.color || "primary"}
                            disabled={
                              action.disabled ? action.disabled(item) : false
                            }
                          >
                            {action.icon}
                          </IconButton>
                        </span>
                      </Tooltip>
                    ))}
                  </TableCell>
                )}
              </TableRow>
            ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length + (actions ? 2 : 1)}
              align="center"
            >
              {loading ? "Loading..." : emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

ReusableTable.propTypes = reusableTablePropTypes;

export default ReusableTable;