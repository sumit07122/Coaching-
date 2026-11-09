import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  ShieldCheck,
  Cpu,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  FileCheck,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SoftwareLicenseRecord } from '../../types';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const SuperAdminLicenses: React.FC = () => {
  const {
    softwareLicenses,
    platformInstitutes,
    issueSoftwareLicense,
    revokeSoftwareLicense,
  } = useApp();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [selectedLicenseForOffline, setSelectedLicenseForOffline] = useState<SoftwareLicenseRecord | null>(null);

  // Form State for Issuing License
  const [selectedInstituteId, setSelectedInstituteId] = useState('');
  const [licenseVersion, setLicenseVersion] = useState('v2.4.0-LTS');
  const [licenseCapacity, setLicenseCapacity] = useState(500);
  const [enableOfflineHardwareLock, setEnableOfflineHardwareLock] = useState(true);
  const [formError, setFormError] = useState('');

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleIssueLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstituteId) {
      setFormError('Please select a coaching institute for license assignment.');
      return;
    }

    issueSoftwareLicense({
      instituteId: selectedInstituteId,
      version: licenseVersion,
      maxStudents: Number(licenseCapacity),
      offlineSupport: enableOfflineHardwareLock,
    });

    setIsIssueModalOpen(false);
    setSelectedInstituteId('');
    setFormError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Software License Management (Model B)
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Govern perpetual one-time software licenses, issue cryptographic activation keys, and configure offline hardware locks.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            if (platformInstitutes.length > 0) setSelectedInstituteId(platformInstitutes[0].id);
            setIsIssueModalOpen(true);
          }}
        >
          Generate & Issue License Key
        </Button>
      </div>

      {/* Legal & Compliance Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          color: '#1e40af',
          fontSize: '13px',
        }}
      >
        <ShieldCheck size={22} style={{ flexShrink: 0, color: '#2563eb' }} />
        <div>
          <strong>Legal Architecture Notice:</strong> Under FIXIA Commercial Model B, software licenses grant the institute perpetual right-of-use.
          In accordance with PostgreSQL check constraint <code>chk_no_source_code_ownership</code>, source code ownership remains strictly with FIXIA Platform.
        </div>
      </div>

      {/* Licenses Table Card */}
      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={18} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Issued Perpetual Software Licenses</span>
              <span className="badge badge-default" style={{ fontSize: '12px' }}>
                {softwareLicenses.length} Total
              </span>
            </div>
          }
          subtitle="Hardware-fingerprinted and standalone offline deployments"
        />

        <div className="sa-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>License Key</th>
                <th>Institute & Client</th>
                <th>Version</th>
                <th>Capacity Limit</th>
                <th>Hardware Binding / Checksum</th>
                <th>Maintenance AMC</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {softwareLicenses.map(lic => (
                <tr key={lic.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.5px' }}>
                        {lic.licenseKey}
                      </code>
                      <button
                        onClick={() => handleCopy(lic.licenseKey)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedKey === lic.licenseKey ? '#059669' : '#94a3b8',
                          padding: '2px',
                        }}
                        title="Copy license key"
                      >
                        {copiedKey === lic.licenseKey ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Issued by: {lic.issuedBy}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{lic.instituteName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{lic.instituteId}</div>
                  </td>
                  <td>
                    <span className="badge badge-default" style={{ fontSize: '11.5px', fontFamily: 'monospace' }}>
                      {lic.licensedVersion}
                    </span>
                  </td>
                  <td>
                    <strong>{lic.maxStudents} Students</strong>
                  </td>
                  <td>
                    {lic.hardwareFingerprint ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                          <Cpu size={13} /> Bound to Hardware
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'monospace' }}>
                          {lic.hardwareFingerprint}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Cloud Unbound</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px' }}>Valid until: {lic.maintenanceValidUntil}</div>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 500 }}>Source Ownership: NO (Licensed)</div>
                  </td>
                  <td>
                    <span
                      className={`sa-badge ${
                        lic.status === 'active'
                          ? 'sa-badge-active'
                          : lic.status === 'pending_activation'
                          ? 'sa-badge-trial'
                          : 'sa-badge-suspended'
                      }`}
                    >
                      {lic.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<FileCheck size={13} />}
                        onClick={() => {
                          setSelectedLicenseForOffline(lic);
                          setIsOfflineModalOpen(true);
                        }}
                      >
                        Offline Bundle
                      </Button>

                      {lic.status === 'active' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            const reason = prompt('Enter mandatory administrative reason for revoking license:');
                            if (reason && reason.trim()) {
                              revokeSoftwareLicense(lic.id, reason.trim());
                            }
                          }}
                        >
                          Revoke
                        </Button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8', padding: '4px 8px' }}>Suspended</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generate & Issue License Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Generate Model B Perpetual Software License"
        size="large"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleIssueLicense}>
              Generate & Assign License
            </Button>
          </div>
        }
      >
        <form onSubmit={handleIssueLicense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px' }}>
              {formError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Target Coaching Institute *
            </label>
            <select
              value={selectedInstituteId}
              onChange={e => setSelectedInstituteId(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              {platformInstitutes.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.city}, {inst.id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Licensed Software Release
              </label>
              <input
                type="text"
                value={licenseVersion}
                onChange={e => setLicenseVersion(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Maximum Student Capacity Limit
              </label>
              <input
                type="number"
                min="50"
                max="5000"
                value={licenseCapacity}
                onChange={e => setLicenseCapacity(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            <input
              type="checkbox"
              checked={enableOfflineHardwareLock}
              onChange={e => setEnableOfflineHardwareLock(e.target.checked)}
            />
            <div>
              <strong>Generate Hardware Fingerprint Lock & Offline Activation Checksum</strong>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Binds license to on-premise institute classroom PC/server for secure air-gapped operation.
              </div>
            </div>
          </label>
        </form>
      </Modal>

      {/* Offline Bundle Payload Checksum Modal */}
      {selectedLicenseForOffline && (
        <Modal
          isOpen={isOfflineModalOpen}
          onClose={() => setIsOfflineModalOpen(false)}
          title={`Offline License Bundle: ${selectedLicenseForOffline.instituteName}`}
          size="large"
          footer={
            <Button variant="primary" onClick={() => setIsOfflineModalOpen(false)}>
              Done
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
              This signed JSON cryptographic token can be imported directly into the institute's offline deployment to authorize students without requiring an active internet connection.
            </p>

            <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{JSON.stringify(
  {
    schema: 'FIXIA-LIC-OFFLINE-V1',
    licenseKey: selectedLicenseForOffline.licenseKey,
    instituteId: selectedLicenseForOffline.instituteId,
    instituteName: selectedLicenseForOffline.instituteName,
    maxStudents: selectedLicenseForOffline.maxStudents,
    hardwareFingerprint: selectedLicenseForOffline.hardwareFingerprint || 'AIRGAP-STANDALONE',
    sha256Checksum: selectedLicenseForOffline.offlineChecksum,
    sourceCodeOwnership: false,
    signature: 'SHA256withRSA:SIGNED_BY_FIXIA_CA_ROOT',
  },
  null,
  2
)}
              </pre>
            </div>

            <Button
              variant="outline"
              icon={<Download size={15} />}
              onClick={() => {
                const blob = new Blob(
                  [
                    JSON.stringify(
                      {
                        schema: 'FIXIA-LIC-OFFLINE-V1',
                        licenseKey: selectedLicenseForOffline.licenseKey,
                        instituteId: selectedLicenseForOffline.instituteId,
                        instituteName: selectedLicenseForOffline.instituteName,
                        maxStudents: selectedLicenseForOffline.maxStudents,
                        checksum: selectedLicenseForOffline.offlineChecksum,
                      },
                      null,
                      2
                    ),
                  ],
                  { type: 'application/json' }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `fixia-license-${selectedLicenseForOffline.instituteId}.json`;
                a.click();
              }}
            >
              Download Offline License File (.json)
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
