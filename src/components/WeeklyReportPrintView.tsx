import React from 'react';
import { WeeklyReport } from '../types';
import { CiputraLogo } from './CiputraLogo';

interface Props {
  report: WeeklyReport;
  pageRefs?: React.RefObject<HTMLDivElement | null>[];
  customLogoUrl?: string | null;
}

export const WeeklyReportPrintView: React.FC<Props> = ({
  report,
  pageRefs = [],
  customLogoUrl,
}) => {
  const highlightsPage1 = (report.weeklyHighlights || []).slice(0, 11);
  const highlightsPage2 = (report.weeklyHighlights || []).slice(11);

  // Common Header component for pages
  const PageHeader: React.FC<{ showMetadata?: boolean }> = ({ showMetadata = false }) => (
    <div>
      <div className="flex items-start justify-between pb-2 mb-2 border-b-2 border-slate-900">
        <div className="w-48 h-14 flex items-center">
          <CiputraLogo size="fit" customLogoUrl={customLogoUrl} className="items-start justify-start w-full h-full" />
        </div>
        <div className="flex-1 text-right">
          <h1 className="text-[17px] font-black tracking-tight text-slate-950 uppercase font-sans leading-tight">
            WEEKLY MAINTENANCE REPORT
          </h1>
          <h2 className="text-[10px] font-bold text-slate-800 tracking-wide uppercase mt-0.5">
            INFORMATION TECHNOLOGY [FINANCE ACCOUNTING DEPARTMENT]
          </h2>
          <h3 className="text-[11px] font-black text-slate-900 tracking-wider uppercase">
            {report.propertyName || 'HOTEL CIPUTRA JAKARTA'}
          </h3>
        </div>
      </div>

      {showMetadata && (
        <>
          {/* Metadata Table */}
          <div className="border border-slate-900 text-[11px] mb-2 bg-white">
            <div className="grid grid-cols-[130px_1fr] border-b border-slate-900">
              <div className="py-0.5 px-2 font-bold text-slate-900 border-r border-slate-900">Property Name</div>
              <div className="py-0.5 px-2 font-bold text-slate-900">: {report.propertyName}</div>
            </div>
            <div className="grid grid-cols-[130px_1fr] border-b border-slate-900">
              <div className="py-0.5 px-2 font-bold text-slate-900 border-r border-slate-900">Prepared</div>
              <div className="py-0.5 px-2 font-medium text-slate-900">: {report.prepared}</div>
            </div>
            <div className="grid grid-cols-[130px_1fr] border-b border-slate-900">
              <div className="py-0.5 px-2 font-bold text-slate-900 border-r border-slate-900">Direct Report</div>
              <div className="py-0.5 px-2 font-medium text-slate-900">: {report.directReport}</div>
            </div>
            <div className="grid grid-cols-[130px_1fr] border-b border-slate-900">
              <div className="py-0.5 px-2 font-bold text-slate-900 border-r border-slate-900">Cc</div>
              <div className="py-0.5 px-2 font-medium text-slate-900">: {report.cc}</div>
            </div>
            <div className="grid grid-cols-[130px_1fr]">
              <div className="py-0.5 px-2 font-bold text-slate-900 border-r border-slate-900">Report</div>
              <div className="py-0.5 px-2 font-bold text-slate-900">: {report.weekLabel}</div>
            </div>
          </div>

          <p className="text-[10px] leading-relaxed text-slate-900 font-serif italic mb-2.5">
            {report.reportPeriodText}
          </p>
        </>
      )}
    </div>
  );

  // Common Footer component
  const PageFooter: React.FC<{ pageNumber: number }> = ({ pageNumber }) => (
    <div className="text-[9.5px] font-bold text-slate-900 uppercase flex justify-between items-center border-t border-slate-400 pt-1 mt-auto">
      <span>{report.footerText || 'INFORMATION TECHNOLOGY [FA DEPT] – 2025'}</span>
      <span className="text-slate-600 font-semibold normal-case">Hal {pageNumber} dari 7</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-8 w-full print:gap-0">
      {/* ========================================================================= */}
      {/* PAGE 1: Header, Metadata, Guest Statistic, Weekly Highlight (1 - 11)      */}
      {/* ========================================================================= */}
      <div
        ref={pageRefs[0]}
        id="weekly-page-1"
        className="a4-page-container bg-white text-slate-950 shadow-xl rounded-none w-[210mm] min-h-[297mm] p-[10mm_14mm] box-border text-[11px] leading-tight font-sans relative flex flex-col justify-between"
      >
        <div>
          <PageHeader showMetadata={true} />

          {/* 1. Guest Statistic */}
          <div className="mb-3">
            <h4 className="text-xs font-bold text-slate-950 mb-1">1. Guest Statistic</h4>
            <div className="border border-slate-900 p-2 bg-white">
              <div className="text-[10.5px] font-semibold text-slate-900 mb-1">
                Weekly Internet Traffic Statistic:
              </div>
              <div className="flex justify-center items-center bg-slate-50 border border-slate-300 rounded mb-2 overflow-hidden min-h-[170px]">
                {report.guestStatistic?.mrtgScreenshotUrl ? (
                  <img
                    src={report.guestStatistic.mrtgScreenshotUrl}
                    alt="Weekly Internet Traffic Statistic"
                    className="w-full max-h-[190px] object-contain"
                  />
                ) : (
                  <div className="text-slate-400 italic text-[11px] py-12 text-center">
                    - Grafik Traffic Internet Mingguan (MRTG bridge-GUEST) -
                  </div>
                )}
              </div>

              <div className="text-[10.5px] text-slate-900 space-y-0.5">
                <div className="font-semibold underline mb-0.5">Note for internet statistic &amp; Issue:</div>
                <div className="pl-3 space-y-0.5">
                  <div>1. Internet bandwidth for Hotel Ciputra Jakarta: <strong>{report.guestStatistic?.bandwidth || '450 Mbps (1:1)'}</strong></div>
                  <div>2. {report.guestStatistic?.freeBod || 'Free BOD from Velo 100 Mbps / month (based on Velo)'}</div>
                  <div>3. {report.guestStatistic?.ispStatus || 'Status line with ISP Velo Networks Fiber Optic with Radio for backup'}</div>
                  <div>4. Total weekly guest devices: <strong>{report.guestStatistic?.connectedDevicesCount || '2903'} users</strong> weekly connected to WiFi</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Weekly Highlight (Part 1: 1 - 11) */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#facc15] text-slate-950 font-extrabold px-2 py-0.5 text-xs border border-amber-400 uppercase font-sans">
                2. Weekly Highlight
              </span>
            </div>
            <div className="border border-slate-900 p-2.5 bg-white text-[10.5px]">
              <ol className="space-y-1 pl-1 list-none">
                {highlightsPage1.map((item, idx) => (
                  <li key={item.id || idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="font-bold w-5 shrink-0 text-right">{idx + 1}.</span>
                    <span className="font-medium text-slate-900">{item.text}</span>
                  </li>
                ))}
                {highlightsPage1.length === 0 && (
                  <li className="text-slate-400 italic text-center py-2">- Belum ada weekly highlight -</li>
                )}
              </ol>
            </div>
          </div>
        </div>

        <PageFooter pageNumber={1} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: Weekly Highlight Continued (12 - 33+), 3. Weekly Antivirus Report  */}
      {/* ========================================================================= */}
      <div
        ref={pageRefs[1]}
        id="weekly-page-2"
        className="a4-page-container bg-white text-slate-950 shadow-xl rounded-none w-[210mm] min-h-[297mm] p-[10mm_14mm] box-border text-[11px] leading-tight font-sans relative flex flex-col justify-between page-break"
      >
        <div>
          <div className="border border-slate-900 p-2.5 bg-white text-[10.5px] mb-4">
            <ol className="space-y-1 pl-1 list-none">
              {highlightsPage2.map((item, idx) => (
                <li key={item.id || idx} className="flex items-start gap-1.5 leading-snug">
                  <span className="font-bold w-6 shrink-0 text-right">{12 + idx}.</span>
                  <span className="font-medium text-slate-900">{item.text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 3. Weekly Antivirus Report */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#facc15] text-slate-950 font-extrabold px-2 py-0.5 text-xs border border-amber-400 uppercase font-sans">
                3. Weekly Antivirus Report
              </span>
            </div>

            <div className="border border-slate-900 p-2 bg-white space-y-3">
              <div>
                <div className="text-[11px] font-bold text-slate-900 mb-1">Status Overview</div>
                <div className="flex justify-center items-center bg-slate-50 border border-slate-300 rounded overflow-hidden min-h-[155px]">
                  {report.antivirusReport?.statusOverviewUrl ? (
                    <img
                      src={report.antivirusReport.statusOverviewUrl}
                      alt="Status Overview"
                      className="w-full max-h-[175px] object-contain"
                    />
                  ) : (
                    <div className="text-slate-400 italic text-[11px] py-10">- Screenshot Status Overview Antivirus -</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-900 mb-1">Security Overview</div>
                <div className="flex justify-center items-center bg-slate-50 border border-slate-300 rounded overflow-hidden min-h-[155px]">
                  {report.antivirusReport?.securityOverviewUrl ? (
                    <img
                      src={report.antivirusReport.securityOverviewUrl}
                      alt="Security Overview"
                      className="w-full max-h-[175px] object-contain"
                    />
                  ) : (
                    <div className="text-slate-400 italic text-[11px] py-10">- Screenshot Security Overview Antivirus -</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <PageFooter pageNumber={2} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 3: Computer Status, Antivirus Detection, Firewall Detections         */}
      {/* ========================================================================= */}
      <div
        ref={pageRefs[2]}
        id="weekly-page-3"
        className="a4-page-container bg-white text-slate-950 shadow-xl rounded-none w-[210mm] min-h-[297mm] p-[10mm_14mm] box-border text-[11px] leading-tight font-sans relative flex flex-col justify-between page-break"
      >
        <div className="space-y-3">
          <div>
            <div className="text-[11px] font-bold text-slate-900 mb-1">Computer Status</div>
            <div className="flex justify-center items-center bg-slate-50 border border-slate-900 p-1 rounded overflow-hidden min-h-[235px]">
              {report.antivirusReport?.computerStatusUrl ? (
                <img
                  src={report.antivirusReport.computerStatusUrl}
                  alt="Computer Status"
                  className="w-full max-h-[250px] object-contain"
                />
              ) : (
                <div className="text-slate-400 italic text-[11px] py-14">- Screenshot Computer Status -</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-900 mb-1">Antivirus Detection</div>
            <div className="flex justify-center items-center bg-slate-50 border border-slate-900 p-1 rounded overflow-hidden min-h-[235px]">
              {report.antivirusReport?.antivirusDetectionUrl ? (
                <img
                  src={report.antivirusReport.antivirusDetectionUrl}
                  alt="Antivirus Detection"
                  className="w-full max-h-[250px] object-contain"
                />
              ) : (
                <div className="text-slate-400 italic text-[11px] py-14">- Screenshot Antivirus Detection -</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-900 mb-1">Firewall Detections</div>
            <div className="flex justify-center items-center bg-slate-50 border border-slate-900 p-1 rounded overflow-hidden min-h-[235px]">
              {report.antivirusReport?.firewallDetectionsUrl ? (
                <img
                  src={report.antivirusReport.firewallDetectionsUrl}
                  alt="Firewall Detections"
                  className="w-full max-h-[250px] object-contain"
                />
              ) : (
                <div className="text-slate-400 italic text-[11px] py-14">- Screenshot Firewall Detections -</div>
              )}
            </div>
          </div>
        </div>

        <PageFooter pageNumber={3} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 4: Fortigate Status                                                  */}
      {/* ========================================================================= */}
      <div
        ref={pageRefs[3]}
        id="weekly-page-4"
        className="a4-page-container bg-white text-slate-950 shadow-xl rounded-none w-[210mm] min-h-[297mm] p-[10mm_14mm] box-border text-[11px] leading-tight font-sans relative flex flex-col justify-between page-break"
      >
        <div>
          <div className="text-[11px] font-bold text-slate-900 mb-2">Fortigate Status:</div>
          <div className="border border-slate-900 p-2 bg-white flex justify-center items-center min-h-[750px]">
            {report.antivirusReport?.fortigateStatusUrl ? (
              <img
                src={report.antivirusReport.fortigateStatusUrl}
                alt="Fortigate Status"
                className="w-full max-h-[770px] object-contain"
              />
            ) : (
              <div className="text-slate-400 italic text-[12px] py-32 text-center">
                - Screenshot Fortigate Status (Traffic Analysis, Policies &amp; Bandwidth Usage) -
              </div>
            )}
          </div>
        </div>

        <PageFooter pageNumber={4} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 5: Projects, Training, Banquet Support, GDrive, AP Monitoring (Part 1) */}
      {/* ========================================================================= */}
      <div
        ref={pageRefs[4]}
        id="weekly-page-5"
        className="a4-page-container bg-white text-slate-950 shadow-xl rounded-none w-[210mm] min-h-[297mm] p-[10mm_14mm] box-border text-[10.5px] leading-tight font-sans relative flex flex-col justify-between page-break"
      >
        <div className="space-y-3">
          {/* 4. Next Month Project & On Going */}
          <div>
            <h4 className="font-bold text-slate-950 mb-1">4. Next Month Project &amp; On Going</h4>
            <table className="w-full border-collapse border border-slate-900 text-center">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                  <th className="border-r border-slate-900 p-1 w-8">No.</th>
                  <th className="border-r border-slate-900 p-1 text-left">Project Name</th>
                  <th className="border-r border-slate-900 p-1 w-28">Target</th>
                  <th className="p-1 text-left">Others</th>
                </tr>
              </thead>
              <tbody>
                {(report.nextMonthProjects || []).map((p, idx) => (
                  <tr key={p.id || idx} className="border-b border-slate-900">
                    <td className="border-r border-slate-900 p-1 font-bold">{idx + 1}.</td>
                    <td className="border-r border-slate-900 p-1 text-left font-semibold">{p.projectName}</td>
                    <td className="border-r border-slate-900 p-1">{p.target}</td>
                    <td className="p-1 text-left">{p.others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Training Time & Train the Trainer */}
          <div>
            <h4 className="font-bold text-slate-950 mb-1">5. Training Time &amp; Train the Trainer</h4>
            <div className="border border-slate-900">
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                    <th className="border-r border-slate-900 p-1 w-8">No.</th>
                    <th className="border-r border-slate-900 p-1 w-24">Date</th>
                    <th className="border-r border-slate-900 p-1 w-24">Dept</th>
                    <th className="p-1 text-left">Topic &amp; Participant</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.trainings || []).map((tr, idx) => (
                    <React.Fragment key={tr.id || idx}>
                      <tr className="border-b border-slate-300">
                        <td className="border-r border-slate-900 p-1 font-bold">{idx + 1}.</td>
                        <td className="border-r border-slate-900 p-1">{tr.date || '-'}</td>
                        <td className="border-r border-slate-900 p-1">{tr.dept || '-'}</td>
                        <td className="p-1 text-left">{tr.topicAndParticipant || '-'}</td>
                      </tr>
                      <tr className="border-b border-slate-900 bg-slate-50/50">
                        <td colSpan={4} className="p-1.5 text-left">
                          <div className="text-[10px] font-semibold text-slate-700 mb-0.5">
                            Training Documentation:
                          </div>
                          {tr.documentationUrl ? (
                            <img
                              src={tr.documentationUrl}
                              alt={`Dokumentasi Training ${idx + 1}`}
                              className="max-h-24 object-contain rounded border border-slate-300"
                            />
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">
                              - Tidak ada dokumentasi training terlampir -
                            </div>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Weekly Banquet Support Event Internet BOD */}
          <div>
            <h4 className="font-bold text-slate-950 mb-1">6. Weekly Banquet Support Event Internet BOD</h4>
            <table className="w-full border-collapse border border-slate-900 text-center">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                  <th className="border-r border-slate-900 p-1 w-8">No.</th>
                  <th className="border-r border-slate-900 p-1 w-20">Date</th>
                  <th className="border-r border-slate-900 p-1 text-left">Event Name</th>
                  <th className="border-r border-slate-900 p-1 w-28">Location</th>
                  <th className="p-1 text-left">Event Requirement Support</th>
                </tr>
              </thead>
              <tbody>
                {(report.banquetSupports || []).map((bq, idx) => (
                  <tr key={bq.id || idx} className="border-b border-slate-900">
                    <td className="border-r border-slate-900 p-1 font-bold">{idx + 1}.</td>
                    <td className="border-r border-slate-900 p-1">{bq.date || '-'}</td>
                    <td className="border-r border-slate-900 p-1 text-left font-semibold">{bq.eventName || '-'}</td>
                    <td className="border-r border-slate-900 p-1">{bq.location || '-'}</td>
                    <td className="p-1 text-left">{bq.requirementSupport || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 7. Daily Activity Report */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#facc15] text-slate-950 font-extrabold px-2 py-0.5 text-xs border border-amber-400 uppercase font-sans">
                7. Daily Activity Report
              </span>
            </div>
            <div className="border border-slate-900 p-2 bg-white text-[10.5px]">
              <div className="font-bold text-slate-900 mb-0.5">Link folder on GDrive: (Encrypt Files)</div>
              <a
                href={report.dailyActivityGdriveLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 underline font-semibold break-all text-[10px]"
              >
                {report.dailyActivityGdriveLink}
              </a>
            </div>
          </div>

          {/* 8. Weekly Monitoring Access Point (Part 1) */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#facc15] text-slate-950 font-extrabold px-2 py-0.5 text-xs border border-amber-400 uppercase font-sans">
                8. Weekly Monitoring Access Point
              </span>
            </div>
            <table className="w-full border-collapse border border-slate-900 text-center">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                  <th className="border-r border-slate-900 p-1 w-36">Zone Floor</th>
                  <th className="border-r border-slate-900 p-1 text-left">Access Point Type &amp; Total</th>
                  <th className="border-r border-slate-900 p-1 w-16">Total</th>
                  <th className="p-1 w-32">Issue</th>
                </tr>
              </thead>
              <tbody>
                {/* Floor 711 */}
                <tr className="border-b border-slate-900">
                  <td className="border-r border-slate-900 p-1.5 font-bold align-middle">Floor 711</td>
                  <td className="border-r border-slate-900 p-1 text-left">
                    <div className="grid grid-cols-[1fr_40px] text-[10px]">
                      {report.accessPointMonitoring?.floor711?.items.map((it, i) => (
                        <React.Fragment key={i}>
                          <span className="font-semibold">{it.type}</span>
                          <span className="text-right font-bold pr-2">{it.total}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="border-r border-slate-900 p-1 font-bold align-middle text-xs">
                    Total {report.accessPointMonitoring?.floor711?.totalAp || 178} AP
                  </td>
                  <td className="p-1 font-semibold align-middle text-emerald-800">
                    {report.accessPointMonitoring?.floor711?.issue || 'No Issue'}
                  </td>
                </tr>

                {/* Floor 1217 */}
                <tr className="border-b border-slate-900">
                  <td className="border-r border-slate-900 p-1.5 font-bold align-middle">Floor 1217</td>
                  <td className="border-r border-slate-900 p-1 text-left">
                    <div className="grid grid-cols-[1fr_40px] text-[10px]">
                      {report.accessPointMonitoring?.floor1217?.items.map((it, i) => (
                        <React.Fragment key={i}>
                          <span className="font-semibold">{it.type}</span>
                          <span className="text-right font-bold pr-2">{it.total}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="border-r border-slate-900 p-1 font-bold align-middle text-xs">
                    Total {report.accessPointMonitoring?.floor1217?.totalAp || 190} AP
                  </td>
                  <td className="p-1 font-semibold align-middle text-emerald-800">
                    {report.accessPointMonitoring?.floor1217?.issue || 'No Issue'}
                  </td>
                </tr>

                {/* Meeting Room & Public Area */}
                <tr className="border-b border-slate-900">
                  <td className="border-r border-slate-900 p-1.5 font-bold align-middle">
                    Meeting Room &amp; Public Area
                  </td>
                  <td className="border-r border-slate-900 p-1 text-left">
                    <div className="grid grid-cols-[1fr_40px] text-[10px]">
                      {report.accessPointMonitoring?.meetingAndPublic?.items.map((it, i) => (
                        <React.Fragment key={i}>
                          <span className="font-semibold">{it.type}</span>
                          <span className="text-right font-bold pr-2">{it.total}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="border-r border-slate-900 p-1 font-bold align-middle text-xs">
                    Total {report.accessPointMonitoring?.meetingAndPublic?.totalAp || 35} AP
                  </td>
                  <td className="p-1 font-semibold align-middle text-emerald-800">
                    {report.accessPointMonitoring?.meetingAndPublic?.issue || 'No Issue'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <PageFooter pageNumber={5} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 6: Access Point Total, 9. Backup Database, 10. HR, 11. POS           */}
      {/* ========================================================================= */}
      <div
        ref={pageRefs[5]}
        id="weekly-page-6"
        className="a4-page-container bg-white text-slate-950 shadow-xl rounded-none w-[210mm] min-h-[297mm] p-[10mm_14mm] box-border text-[10.5px] leading-tight font-sans relative flex flex-col justify-between page-break"
      >
        <div className="space-y-3">
          {/* Total AP on HCJ Summary */}
          <div>
            <table className="w-full border-collapse border border-slate-900 text-center">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                  <th className="border-r border-slate-900 p-1 w-36">Zone Floor</th>
                  <th className="border-r border-slate-900 p-1 text-left">Access Point Type &amp; Total</th>
                  <th className="border-r border-slate-900 p-1 w-16">Total</th>
                  <th className="p-1 w-32">Issue</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-900 bg-slate-50/70 font-bold">
                  <td className="border-r border-slate-900 p-2 align-middle">
                    Total Access Point on HCJ
                  </td>
                  <td className="border-r border-slate-900 p-1.5 text-left">
                    <div className="grid grid-cols-[1fr_40px] text-[10px]">
                      {report.accessPointMonitoring?.totalSummary?.items.map((it, i) => (
                        <React.Fragment key={i}>
                          <span className="font-semibold">{it.type}</span>
                          <span className="text-right font-bold pr-2">{it.total}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="border-r border-slate-900 p-1 font-black text-sm align-middle text-slate-950">
                    {report.accessPointMonitoring?.totalSummary?.totalAp || 403}
                  </td>
                  <td className="p-1 font-semibold align-middle text-emerald-800">
                    Good &amp; Operational
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 9. Backup Database */}
          <div>
            <h4 className="font-bold text-slate-950 mb-1">9. Backup Database</h4>
            <table className="w-full border-collapse border border-slate-900 text-center">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                  <th className="border-r border-slate-900 p-1 w-24">Day</th>
                  <th className="border-r border-slate-900 p-1 w-24">Date</th>
                  <th className="border-r border-slate-900 p-1 w-16">Time</th>
                  <th className="border-r border-slate-900 p-1 text-left">Database Location</th>
                  <th className="p-1 w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {(report.databaseBackups || []).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-900">
                    <td className="border-r border-slate-900 p-1 font-semibold">{row.day}</td>
                    <td className="border-r border-slate-900 p-1">{row.date}</td>
                    <td className="border-r border-slate-900 p-1">{row.time}</td>
                    <td className="border-r border-slate-900 p-1 text-left font-medium">{row.databaseLocation}</td>
                    <td className="p-1 font-bold text-emerald-800">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* GDrive Backup Links */}
            <div className="border-x border-b border-slate-900 p-2 bg-white text-[10px] space-y-1">
              <div className="font-bold text-slate-900">Link backup for GDrive: (Encrypt Files)</div>
              <div>
                <a
                  href={report.databaseBackupLinks?.databaseLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 underline font-semibold break-all"
                >
                  {report.databaseBackupLinks?.databaseLink}
                </a>{' '}
                <span className="font-bold text-slate-800">(Database)</span>
              </div>
              <div>
                <a
                  href={report.databaseBackupLinks?.dataCenterLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 underline font-semibold break-all"
                >
                  {report.databaseBackupLinks?.dataCenterLink}
                </a>{' '}
                <span className="font-bold text-slate-800">(Data Center)</span>
              </div>
              <div>
                <a
                  href={report.databaseBackupLinks?.userDataLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 underline font-semibold break-all"
                >
                  {report.databaseBackupLinks?.userDataLink}
                </a>{' '}
                <span className="font-bold text-slate-800">(User Data)</span>
              </div>
              <div className="font-semibold text-slate-900 pt-0.5">
                Up to date for backup data to GDrive with account:{' '}
                <strong className="text-emerald-900">{report.databaseBackupLinks?.accountEmail || 'itmhcj@swissbelhotel.coms'}</strong>
              </div>
            </div>
          </div>

          {/* 10. New Employee Data System (HR Request) */}
          <div>
            <h4 className="font-bold text-slate-950 mb-1">10. New Employee Data System (HR Request)</h4>
            <div className="border border-slate-900 text-[10.5px]">
              <div className="p-1.5 bg-slate-100 font-bold border-b border-slate-900">Details</div>
              <div className="p-2 border-b border-slate-900 font-semibold text-slate-900">
                {report.newEmployeeSystem?.details || 'Attached on daily maintenance, New SAA'}
              </div>
              <div className="p-2 bg-white space-y-0.5 text-[10px]">
                <div className="font-bold underline">Note:</div>
                <div>Link File Output</div>
                <a
                  href={report.newEmployeeSystem?.fileLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 underline font-semibold break-all"
                >
                  {report.newEmployeeSystem?.fileLink}
                </a>
                <div className="font-bold text-slate-900 pt-0.5">
                  {report.newEmployeeSystem?.noteTitle || 'File on Spreadsheet New user SYSTEM ACCESS AUTHORIZATION REQUEST FORM'}
                </div>
              </div>
            </div>
          </div>

          {/* 11. New Menu on POS Request (This Week) */}
          <div>
            <h4 className="font-bold text-slate-950 mb-1">11. New Menu on POS Request (This Week)</h4>
            <div className="border border-slate-900 text-[10.5px]">
              <div className="p-1.5 bg-slate-100 font-bold border-b border-slate-900">Details Add Menu</div>
              <div className="p-2 border-b border-slate-900 font-semibold text-slate-900">
                {report.newMenuPos?.details || 'Attached on daily maintenance, DOFB memo and tax calculation and Majoo'}
              </div>
              <div className="p-2 bg-white space-y-0.5 text-[10px]">
                <div className="font-bold underline">Note:</div>
                <div>
                  Link File Output{' '}
                  <a
                    href={report.newMenuPos?.fileLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 underline font-bold"
                  >
                    Klick Here!
                  </a>
                </div>
                <div className="font-bold text-slate-900 pt-0.5">
                  {report.newMenuPos?.noteTitle || 'File on Excel has been update for POS & BHC'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <PageFooter pageNumber={6} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 7: 12. SARA System Report, 13. Others, Signature Block               */}
      {/* ========================================================================= */}
      <div
        ref={pageRefs[6]}
        id="weekly-page-7"
        className="a4-page-container bg-white text-slate-950 shadow-xl rounded-none w-[210mm] min-h-[297mm] p-[10mm_14mm] box-border text-[11px] leading-tight font-sans relative flex flex-col justify-between page-break"
      >
        <div>
          {/* 12. Sara System Report IT Section */}
          <div className="mb-4">
            <h4 className="font-bold text-slate-950 mb-1.5">12. Sara System Report IT Section</h4>
            <div className="border border-slate-900 p-2 bg-white">
              <div className="flex justify-center items-center bg-slate-50 border border-slate-300 rounded mb-2 overflow-hidden min-h-[260px]">
                {report.saraSystemReport?.screenshotUrl ? (
                  <img
                    src={report.saraSystemReport.screenshotUrl}
                    alt="SARA System Report IT Section"
                    className="w-full max-h-[300px] object-contain"
                  />
                ) : (
                  <div className="text-slate-400 italic text-[11px] py-20 text-center">
                    - Screenshot SARA System Report IT Section (Tickets, Requests &amp; Resolution Time) -
                  </div>
                )}
              </div>
              <div className="text-[10.5px] text-slate-900 font-semibold border-t border-slate-200 pt-1.5">
                Note: {report.saraSystemReport?.note || 'No pending task from IT during last week. Has been done to handling and solve.'}
              </div>
            </div>
          </div>

          {/* 13. Others Information */}
          <div className="mb-8">
            <h4 className="font-bold text-slate-950 mb-1">13. Others Information</h4>
            <div className="border border-slate-900 p-2.5 bg-white text-xs font-medium min-h-12 whitespace-pre-line">
              {report.othersInformation || '-'}
            </div>
          </div>

          {/* Executive Sign-off Block */}
          <div className="pt-4 max-w-xs text-xs">
            <div className="font-semibold text-slate-900 mb-1">{report.signatureCityDate}</div>
            <div className="font-bold text-slate-900 mb-20">Prepared by,</div>
            <div className="font-extrabold text-slate-950 underline text-sm">{report.signatureName}</div>
            <div className="font-bold text-slate-800 text-[11px]">{report.signatureTitle}</div>
          </div>
        </div>

        <PageFooter pageNumber={7} />
      </div>
    </div>
  );
};
