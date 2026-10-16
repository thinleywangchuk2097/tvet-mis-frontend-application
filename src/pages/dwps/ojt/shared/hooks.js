// src/pages/dwps/ojt/shared/hooks.js
import { useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";

export const useApiFetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (serviceFn, params, errorMsg) => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceFn(...params);
      return response.data || [];
    } catch (err) {
      console.error(errorMsg, err);
      setError(err);
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({ loading, error, fetchData }),
    [loading, error, fetchData],
  );
};

export const useDialogState = (entityKeys = ["firm", "placement"]) => {
  const buildInitial = () => {
    const base = {
      delete: { open: false, item: null, type: "" },
    };
    entityKeys.forEach((k) => {
      base[k] = { open: false, edit: false, view: false };
    });
    return base;
  };

  const [dialogState, setDialogState] = useState(buildInitial);

  const openDialog = useCallback((type, options = {}) => {
    setDialogState((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...options, open: true },
    }));
  }, []);

  // FIX: reset edit/view flags too so the dialog truly closes.
  // Previously only `open: false` was set, but `isOpen` in EntityManager
  // is computed as `open || edit || view`, so the dialog stayed visible.
  const closeDialog = useCallback((type) => {
    setDialogState((prev) => ({
      ...prev,
      [type]: { open: false, edit: false, view: false },
    }));
  }, []);

  const openDeleteDialog = useCallback((item, type) => {
    setDialogState((prev) => ({
      ...prev,
      delete: { open: true, item, type },
    }));
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      delete: { open: false, item: null, type: "" },
    }));
  }, []);

  return useMemo(
    () => ({
      dialogState,
      openDialog,
      closeDialog,
      openDeleteDialog,
      closeDeleteDialog,
    }),
    [dialogState, openDialog, closeDialog, openDeleteDialog, closeDeleteDialog],
  );
};

export const useSelectedItem = (entityKeys = ["firm", "placement"]) => {
  const buildInitial = () =>
    Object.fromEntries(entityKeys.map((k) => [k, null]));

  const [selected, setSelected] = useState(buildInitial);

  const selectItem = useCallback((type, item) => {
    setSelected((prev) => ({ ...prev, [type]: item }));
  }, []);

  const clearSelected = useCallback((type) => {
    setSelected((prev) => ({ ...prev, [type]: null }));
  }, []);

  return useMemo(
    () => ({ selected, selectItem, clearSelected }),
    [selected, selectItem, clearSelected],
  );
};

export const usePagination = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = useCallback((_, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  }, []);

  return useMemo(
    () => ({
      page,
      rowsPerPage,
      handleChangePage,
      handleChangeRowsPerPage,
    }),
    [page, rowsPerPage, handleChangePage, handleChangeRowsPerPage],
  );
};
