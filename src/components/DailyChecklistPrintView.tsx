import React from 'react';
import { DailyChecklistReport } from '../types';
import { CiputraLogo } from './CiputraLogo';

interface Props {
  report: DailyChecklistReport;
  pageRef?: React.RefObject<HTMLDivElement | null>;
  customLogoUrl?: string | null;
}

export const DailyChecklistPrintView: React.FC<Props> = ({
  report,
  pageRef,
  customLogoUrl,
}) => {
  return (
    <div className="flex justify-center w-full">
      <div
        ref={pageRef}
        id="checklist-page"
        className="a4-page-container bg-white text-slate-900 shadow-xl rounded-none w-[210mm] min-h-[297mm] p-[8mm_12mm] box-border text-[9.5px] leading-tight font-sans relative flex flex-col justify-between"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#0f172a',
        }}
      >
        <div>
          {/* Modern Executive Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-slate-800">
            <div className="w-36 flex items-center">
              <CiputraLogo size="sm" customLogoUrl={customLogoUrl} className="items-start" />
            </div>
            <div className="flex-1 text-center pr-28">
              <h1 className="text-base font-extrabold tracking-tight text-slate-950 uppercase font-sans">
                IT DAILY CHECKLIST ACTIVITY
              </h1>
              <h2 className="text-xs font-bold text-amber-700 tracking-wider uppercase mt-0.5">
                {report.propertyName || 'HOTEL CIPUTRA JAKARTA'}
              </h2>
              <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
                {report.formattedDate}
              </div>
            </div>
          </div>

          {/* Shifts Subheader: Sleek Pills */}
          <div className="flex items-center justify-center gap-3 text-[10px] mb-2 font-medium">
            <div className="px-3 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-amber-950 font-bold">
              Morning Shift: <span className="font-extrabold text-amber-900">{report.morningShiftPic || '-'}</span>
            </div>
            <div className="px-3 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-950 font-bold">
              Evening Shift: <span className="font-extrabold text-indigo-900">{report.eveningShiftPic || '-'}</span>
            </div>
          </div>

          {/* 31 Checklist Items Table */}
          <table className="w-full border-collapse border border-slate-300 text-[9px] mb-1 rounded-md overflow-hidden shadow-2xs">
            <thead>
              <tr className="bg-[#d97706] text-black font-extrabold text-center border-b border-amber-800">
                <th className="py-1 px-1 w-7 border-r border-amber-700 text-center">No.</th>
                <th className="py-1 px-2 text-left w-56 border-r border-amber-700">Task List</th>
                <th className="py-1 px-1.5 w-24 text-center border-r border-amber-700">Person Incharge</th>
                <th className="py-1 px-1.5 w-20 text-center border-r border-amber-700">Status</th>
                <th className="py-1 px-2 text-left">Remark</th>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item, index) => {
                const isChecked = item.status === 'Checked';
                const isEven = index % 2 === 1;
                const cellPy = report.items.length > 32 ? 'py-[1.5px]' : 'py-[2.5px]';

                return (
                  <tr
                    key={item.id || index}
                    className={`border-b border-slate-200 transition ${
                      isEven ? 'bg-slate-50/70' : 'bg-white'
                    } ${!isChecked ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className={`border-r border-slate-200 ${cellPy} px-1 text-center font-bold text-slate-600`}>
                      {index + 1}
                    </td>
                    <td className={`border-r border-slate-200 ${cellPy} px-2 text-left font-bold text-slate-900`}>
                      {item.taskList}
                    </td>
                    <td className={`border-r border-slate-200 ${cellPy} px-1.5 text-center font-semibold text-slate-700`}>
                      {item.personIncharge}
                    </td>
                    <td className={`border-r border-slate-200 ${cellPy} px-1.5 text-center`}>
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[8.5px] px-1.5 py-[1px] rounded-xs border ${
                          isChecked
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300'
                        }`}
                      >
                        {isChecked ? (
                          <>
                            <span className="text-emerald-700 font-extrabold text-[9px]">☑</span> Checked
                          </>
                        ) : (
                          <span>{item.status}</span>
                        )}
                      </span>
                    </td>
                    <td className={`${cellPy} px-2 text-left font-medium text-slate-800 truncate max-w-[280px]`}>
                      {item.remark || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {report.generalNotes && (
            <div className="mt-1 border border-slate-200 rounded p-1 text-[8.5px] bg-slate-50 font-medium">
              <span className="font-bold text-slate-800">General Notes:</span> {report.generalNotes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-[8.5px] text-slate-500 flex justify-between items-center border-t border-slate-300 pt-1 mt-1 font-medium">
          <span>{report.propertyName || 'Hotel Ciputra Jakarta'} · IT Department Daily Checklist</span>
          <span className="font-semibold text-slate-700">Status: Verified by IT Team & Management</span>
        </div>
      </div>
    </div>
  );
};
