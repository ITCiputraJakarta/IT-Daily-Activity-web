import React from 'react';
import { DailyActivityReport } from '../types';
import { CiputraLogo } from './CiputraLogo';

interface Props {
  report: DailyActivityReport;
  page1Ref?: React.RefObject<HTMLDivElement | null>;
  page2Ref?: React.RefObject<HTMLDivElement | null>;
  customLogoUrl?: string | null;
}

export const DailyActivityPrintView: React.FC<Props> = ({
  report,
  page1Ref,
  page2Ref,
  customLogoUrl,
}) => {
  const formatCleanTemp = (val?: string) => {
    if (!val || !val.trim()) return '-';
    const m = val.match(/[\d.]+/);
    return m ? `${m[0]}°C` : '-';
  };

  const formatCleanHum = (val?: string) => {
    if (!val || !val.trim()) return '-';
    const m = val.match(/[\d.]+/);
    return m ? `${m[0]}%` : '-';
  };
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* ================= PAGE 1 ================= */}
      <div
        ref={page1Ref}
        id="activity-page-1"
        className="a4-page-container bg-white text-slate-900 shadow-xl rounded-none w-[210mm] min-h-[297mm] p-[10mm_14mm] box-border text-[11px] leading-tight font-sans relative flex flex-col justify-between"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#0f172a',
        }}
      >
        <div>
          {/* Modern Executive Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-800">
            <div className="w-44 h-14 flex items-center">
              <CiputraLogo size="fit" customLogoUrl={customLogoUrl} className="items-start justify-start w-full h-full" />
            </div>
            <div className="flex-1 text-right">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase font-sans">
                IT DAILY ACTIVITY REPORT
              </h1>
              <p className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase mt-0.5">
                {report.propertyName || 'HOTEL CIPUTRA JAKARTA'} · IT DEPARTMENT
              </p>
            </div>
          </div>

          {/* Metadata Card: Modern Clean Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-4 shadow-2xs">
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 text-xs">
              <div className="p-1.5 bg-slate-50 font-semibold text-slate-600 border-r border-slate-200">
                Property Name
              </div>
              <div className="p-1.5 font-bold text-slate-900">: {report.propertyName}</div>
            </div>
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 text-xs">
              <div className="p-1.5 bg-slate-50 font-semibold text-slate-600 border-r border-slate-200">
                Prepared
              </div>
              <div className="p-1.5 font-semibold text-slate-800">: {report.prepared}</div>
            </div>
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 text-xs">
              <div className="p-1.5 bg-slate-50 font-semibold text-slate-600 border-r border-slate-200">
                Direct Report
              </div>
              <div className="p-1.5 font-semibold text-slate-800">: {report.directReport}</div>
            </div>
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 text-xs">
              <div className="p-1.5 bg-slate-50 font-semibold text-slate-600 border-r border-slate-200">
                Cc
              </div>
              <div className="p-1.5 font-semibold text-slate-800">: {report.cc}</div>
            </div>
            <div className="grid grid-cols-[140px_1fr] text-xs bg-cyan-50/80">
              <div className="p-1.5 bg-cyan-100/60 font-bold text-cyan-950 border-r border-slate-200">
                Report Date
              </div>
              <div className="p-1.5 font-extrabold text-cyan-950">: {report.formattedDate}</div>
            </div>
          </div>

          {/* Section 1 Header: Modern Amber Tag with Line */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-[#facc15] text-slate-950 font-extrabold px-2.5 py-0.5 text-xs rounded-xs border border-amber-400 tracking-wide uppercase font-sans shadow-2xs">
              1. IT Log Book Activity
            </div>
            <div className="flex-1 h-[1.5px] bg-slate-200"></div>
          </div>

          {/* Activities Table */}
          <table className="w-full border-collapse border border-slate-300 text-xs mb-3 rounded-lg overflow-hidden shadow-2xs">
            <thead>
              <tr className="bg-slate-800 text-white font-bold text-center border-b border-slate-800">
                <th className="py-1.5 px-1 w-8 border-r border-slate-700 text-center">No</th>
                <th className="py-1.5 px-2.5 text-left border-r border-slate-700">Activities Details</th>
                <th className="py-1.5 px-2 w-32 border-r border-slate-700">User / Client</th>
                <th className="py-1.5 px-2 w-20 border-r border-slate-700">Status</th>
                <th className="py-1.5 px-2 w-24">PIC IT</th>
              </tr>
            </thead>
            <tbody>
              {report.logBookActivities.map((act, index) => (
                <React.Fragment key={act.id || index}>
                  {/* Row Description */}
                  <tr className="border-b border-slate-200 bg-slate-50/60 hover:bg-slate-50">
                    <td className="border-r border-slate-200 p-1.5 text-center font-bold text-slate-700 align-top">
                      {index + 1}.
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-left align-top whitespace-pre-line font-bold text-slate-900">
                      {act.details || '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-center align-middle font-semibold text-slate-700">
                      {act.clientName ? (
                        <div className="font-bold text-slate-900 text-[11px] leading-tight mb-0.5">
                          {act.clientName}
                        </div>
                      ) : null}
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/90 text-[9.5px] inline-block font-semibold text-slate-800">
                        {act.clientDepartment || act.userClient || 'IT'}
                      </span>
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-center align-middle">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {act.status}
                      </span>
                    </td>
                    <td className="p-1.5 text-center align-middle font-bold uppercase text-slate-800">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-900">
                        {act.pic}
                      </span>
                    </td>
                  </tr>

                  {/* Picture / Documentation Section */}
                  <tr className="border-b border-slate-300 bg-white">
                    <td colSpan={5} className="p-2 pl-3">
                      <div className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Picture or Documentation:
                      </div>
                      {act.pictureUrl ? (
                        <div className="flex justify-center items-center py-1 bg-slate-50/50 rounded border border-slate-100">
                          <img
                            src={act.pictureUrl}
                            alt={`Doc ${index + 1}`}
                            className="max-h-28 max-w-[260px] object-contain rounded-md border border-slate-200 shadow-xs"
                          />
                        </div>
                      ) : (
                        <div className="h-6 flex items-center text-[10px] text-slate-400 italic">
                          - Tidak ada dokumentasi foto terlampir -
                        </div>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Page 1 Footer */}
        <div className="text-[9.5px] text-slate-500 flex justify-between items-center border-t border-slate-300 pt-1.5 mt-2">
          <span className="font-semibold">{report.propertyName || 'Hotel Ciputra Jakarta'} · IT Department Daily Report</span>
          <span className="font-bold text-slate-700">Halaman 1 dari 2</span>
        </div>
      </div>

      {/* ================= PAGE 2 ================= */}
      <div
        ref={page2Ref}
        id="activity-page-2"
        className="a4-page-container bg-white text-slate-900 shadow-xl rounded-none w-[210mm] min-h-[297mm] p-[10mm_14mm] box-border text-[11px] leading-tight font-sans relative flex flex-col justify-between page-break"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#0f172a',
        }}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-800">
            <div className="w-44 h-14 flex items-center">
              <CiputraLogo size="fit" customLogoUrl={customLogoUrl} className="items-start justify-start w-full h-full" />
            </div>
            <div className="flex-1 text-right">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase font-sans">
                IT DAILY ACTIVITY REPORT
              </h1>
              <p className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase mt-0.5">
                {report.propertyName || 'HOTEL CIPUTRA JAKARTA'} · IT DEPARTMENT
              </p>
            </div>
          </div>

          {/* Section 2: SARA Activity Today */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-[#facc15] text-slate-950 font-extrabold px-2.5 py-0.5 text-xs rounded-xs border border-amber-400 tracking-wide uppercase font-sans shadow-2xs">
                2. SARA Activity Today
              </div>
              <div className="flex-1 h-[1.5px] bg-slate-200"></div>
            </div>
            <div className="border border-slate-300 rounded-lg p-2.5 bg-white flex flex-col items-center shadow-2xs">
              {report.saraActivity.screenshotUrl ? (
                <img
                  src={report.saraActivity.screenshotUrl}
                  alt="SARA Activity Screenshot"
                  className="w-full max-h-48 object-contain rounded border border-slate-100"
                />
              ) : (
                <div className="h-24 w-full flex items-center justify-center text-slate-400 text-xs italic bg-slate-50 rounded">
                  - Belum ada screenshot SARA -
                </div>
              )}
              {report.saraActivity.notes && (
                <div className="w-full mt-2 text-[10px] text-slate-700 italic border-t border-slate-200 pt-1.5">
                  <span className="font-bold text-slate-800">Catatan Tiket:</span> {report.saraActivity.notes}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Internet Total Average Traffic Evening */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-[#facc15] text-slate-950 font-extrabold px-2.5 py-0.5 text-xs rounded-xs border border-amber-400 tracking-wide uppercase font-sans shadow-2xs">
                3. Internet Total Average Traffic Evening
              </div>
              <div className="flex-1 h-[1.5px] bg-slate-200"></div>
            </div>
            <div className="border border-slate-300 rounded-lg p-2.5 bg-white flex flex-col items-center shadow-2xs">
              {report.internetTraffic.screenshotUrl ? (
                <img
                  src={report.internetTraffic.screenshotUrl}
                  alt="Internet Traffic Analysis"
                  className="w-full max-h-52 object-contain rounded border border-slate-100"
                />
              ) : (
                <div className="h-28 w-full flex items-center justify-center text-slate-400 text-xs italic bg-slate-50 rounded">
                  - Belum ada grafik traffic internet -
                </div>
              )}
              {(report.internetTraffic.maxIn || report.internetTraffic.avgIn || report.internetTraffic.currentIn) && (
                <div className="w-full mt-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
                  <div className="p-1 rounded bg-emerald-50 border border-emerald-200 text-[10px]">
                    <span className="text-emerald-800 font-semibold block">Max In (Bandwidth)</span>
                    <span className="font-extrabold text-emerald-950 text-xs">{report.internetTraffic.maxIn || '-'} Mbps</span>
                  </div>
                  <div className="p-1 rounded bg-emerald-50 border border-emerald-200 text-[10px]">
                    <span className="text-emerald-800 font-semibold block">Avg In (Average)</span>
                    <span className="font-extrabold text-emerald-950 text-xs">{report.internetTraffic.avgIn || '-'} Mbps</span>
                  </div>
                  <div className="p-1 rounded bg-emerald-50 border border-emerald-200 text-[10px]">
                    <span className="text-emerald-800 font-semibold block">Current In (Aktual)</span>
                    <span className="font-extrabold text-emerald-950 text-xs">{report.internetTraffic.currentIn || '-'} Mbps</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Server Temperature */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-[#facc15] text-slate-950 font-extrabold px-2.5 py-0.5 text-xs rounded-xs border border-amber-400 tracking-wide uppercase font-sans shadow-2xs">
                4. Server Temperature
              </div>
              <div className="flex-1 h-[1.5px] bg-slate-200"></div>
            </div>
            <div className="border border-slate-300 rounded-lg p-2.5 bg-white flex flex-col items-center shadow-2xs">
              {report.serverTemperature.photoUrl ? (
                <div className="flex justify-center items-center w-full py-1">
                  <img
                    src={report.serverTemperature.photoUrl}
                    alt="Server Temperature & Humidity Meter"
                    className="max-h-48 object-contain rounded-md border border-slate-200 shadow-xs"
                  />
                </div>
              ) : (
                <div className="h-24 w-full flex items-center justify-center text-slate-400 text-xs italic bg-slate-50 rounded">
                  - Belum ada foto termometer server -
                </div>
              )}
              <div className="w-full mt-2 pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-semibold">
                <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-bold text-[10px] border border-slate-200">
                  {report.serverTemperature.stdTemp || 'Std 17°C to 23°C'} · {report.serverTemperature.stdHum || 'Hum 45%-55%'}
                </span>
                {(report.serverTemperature.currentTemp || report.serverTemperature.currentHum) && (
                  <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-md font-extrabold text-xs">
                    Actual: {formatCleanTemp(report.serverTemperature.currentTemp)} / {formatCleanHum(report.serverTemperature.currentHum)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Other Issue by Day */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-[#facc15] text-slate-950 font-extrabold px-2.5 py-0.5 text-xs rounded-xs border border-amber-400 tracking-wide uppercase font-sans shadow-2xs">
                5. Other Issue by Day
              </div>
              <div className="flex-1 h-[1.5px] bg-slate-200"></div>
            </div>
            <div className="border border-slate-300 rounded-lg p-3 min-h-12 bg-white text-xs font-semibold text-slate-800 whitespace-pre-line shadow-2xs">
              {report.otherIssues || '-'}
            </div>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="text-[9.5px] text-slate-500 flex justify-between items-center border-t border-slate-300 pt-1.5 mt-2">
          <span className="font-semibold">{report.propertyName || 'Hotel Ciputra Jakarta'} · IT Department Daily Report</span>
          <span className="font-bold text-slate-700">Halaman 2 dari 2</span>
        </div>
      </div>
    </div>
  );
};
