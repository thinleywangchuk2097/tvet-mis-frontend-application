// src/pages/dwps/ojt/shared/DocumentLinks.jsx
import React from "react";
import { Link, IconButton } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import { getDocumentLinks } from "./utils.jsx";
import { documentLinksPropTypes } from "./propTypes";

export const DocumentLinks = ({ documents, onDownload, downloading }) => {
  const docs = getDocumentLinks(documents);
  if (!docs.length) return <span>N/A</span>;
  return docs.map((d, idx) => (
    <div
      key={d.id || idx}
      style={{ display: "flex", alignItems: "center", gap: 8 }}
    >
      <Link component="button" variant="body2" onClick={() => onDownload(d)}>
        {d.name}
      </Link>
      <IconButton
        size="small"
        onClick={() => onDownload(d)}
        disabled={downloading}
      >
        <LaunchIcon fontSize="small" />
      </IconButton>
    </div>
  ));
};

DocumentLinks.propTypes = documentLinksPropTypes;

export default DocumentLinks;