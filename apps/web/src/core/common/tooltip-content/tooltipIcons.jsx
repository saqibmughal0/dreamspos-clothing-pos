import React from 'react';
import { Link } from "react-router-dom";
import { Tooltip } from 'antd';
import ImageWithBasePath from '../../img/imagewithbasebath';

const TooltipIcons = ({ onPdf, onExcel }) => {
  return (
    <>
      <li>
        <Tooltip title="PDF Export">
          <Link to="#" onClick={(e) => { e.preventDefault(); onPdf ? onPdf() : window.print(); }}>
            <ImageWithBasePath src="assets/img/icons/pdf.svg" alt="PDF" />
          </Link>
        </Tooltip>
      </li>
      <li>
        <Tooltip title="Excel / CSV Export">
          <Link to="#" onClick={(e) => {
            e.preventDefault();
            if (onExcel) {
              onExcel();
            } else {
              window.open("/api/reports/export/sales", "_blank");
            }
          }}>
            <ImageWithBasePath src="assets/img/icons/excel.svg" alt="Excel" />
          </Link>
        </Tooltip>
      </li>
    </>
  );
};

export default TooltipIcons;
