import React, { cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import './adminShared.css';

const getRowActions = (actions, row) => (typeof actions === 'function' ? actions(row) : actions) || [];

const renderCell = (column, row) => (
  typeof column.render === 'function' ? column.render(row) : row?.[column.key]
);

const useIsMobileTable = () => {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && (window.matchMedia
      ? window.matchMedia('(max-width: 768px)').matches
      : window.innerWidth <= 768)
  ));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(max-width: 768px)');
      const handleChange = (event) => setIsMobile(event.matches);
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
      mediaQuery.addListener?.(handleChange);
      return () => mediaQuery.removeListener?.(handleChange);
    }

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

export const DataToolbar = ({ search, filters = [], primaryAction }) => (
  <div className="admin-shared-toolbar">
    {search && (
      <label className="admin-shared-search">
        <span className="admin-shared-visually-hidden">{search.placeholder || 'Cari data'}</span>
        <span className="admin-shared-search-icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          value={search.value || ''}
          placeholder={search.placeholder || 'Cari data'}
          onChange={(event) => search.onChange?.(event.target.value)}
        />
      </label>
    )}
    {filters.map((filter) => (
      <label className="admin-shared-filter" key={filter.key}>
        <span>{filter.label}</span>
        <select value={filter.value ?? ''} onChange={(event) => filter.onChange?.(event.target.value)}>
          {(filter.options || []).map((option) => {
            const value = typeof option === 'object' ? option.value : option;
            const label = typeof option === 'object' ? option.label : option;
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>
      </label>
    ))}
    {primaryAction && (
      <button
        type="button"
        className="admin-shared-primary-action"
        onClick={primaryAction.onClick}
        disabled={primaryAction.disabled}
      >
        {primaryAction.icon && <span aria-hidden="true">{primaryAction.icon}</span>}
        {primaryAction.label}
      </button>
    )}
  </div>
);

export const Skeleton = ({ rows = 3, variant = 'line', label = 'Memuat data' }) => (
  <div className={`admin-shared-skeleton admin-shared-skeleton--${variant}`} role="status" aria-label={label}>
    {Array.from({ length: Math.max(1, rows) }, (_, index) => (
      <span className="admin-shared-skeleton-row" key={index} />
    ))}
  </div>
);

export const ResponsiveTable = ({
  columns = [],
  rows = [],
  getRowId = (row) => row?.id,
  actions,
  loading = false,
  emptyState = null,
  caption = 'Daftar data'
}) => {
  const isMobile = useIsMobileTable();
  if (loading) return <Skeleton rows={4} variant="table" />;
  if (!rows.length) {
    return emptyState || <EmptyState title="Belum ada data" description="Data akan tampil di sini setelah tersedia." />;
  }

  return (
    <div className="admin-shared-table-wrap">
      {isMobile ? (
        <div className="admin-shared-cards" aria-label={`${caption}, tampilan kartu`}>
          {rows.map((row) => {
            const primaryColumn = columns.find((column) => column.primary) || columns[0];
            const rowActions = getRowActions(actions, row);
            return (
              <article className="admin-shared-data-card" key={getRowId(row)}>
                {primaryColumn && (
                  <h3 className="admin-shared-data-card-title">{renderCell(primaryColumn, row)}</h3>
                )}
                <dl>
                  {columns.filter((column) => column !== primaryColumn).map((column) => (
                    <div className="admin-shared-data-card-field" key={column.key}>
                      <dt>{column.label}</dt>
                      <dd>{renderCell(column, row)}</dd>
                    </div>
                  ))}
                </dl>
                {rowActions.length > 0 && (
                  <div className="admin-shared-card-actions">
                    {rowActions.map((action) => (
                      <button
                        type="button"
                        className={action.danger ? 'admin-shared-action is-danger' : 'admin-shared-action'}
                        key={action.label}
                        aria-label={action.ariaLabel || `${action.label}${row?.name ? ` ${row.name}` : ''}`}
                        disabled={action.disabled}
                        onClick={() => action.onClick?.(row)}
                      >
                        {action.icon && <span aria-hidden="true">{action.icon}</span>}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <table className="admin-shared-table">
          <caption className="admin-shared-visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}
              {actions && <th scope="col"><span className="admin-shared-visually-hidden">Aksi</span></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowActions = getRowActions(actions, row);
              return (
                <tr key={getRowId(row)}>
                  {columns.map((column) => (
                    <td key={column.key} data-label={column.label} className={column.primary ? 'is-primary' : undefined}>
                      {renderCell(column, row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="admin-shared-row-actions" data-label="Aksi">
                      {rowActions.map((action) => (
                        <button
                          type="button"
                          className={action.danger ? 'admin-shared-action is-danger' : 'admin-shared-action'}
                          key={action.label}
                          aria-label={action.ariaLabel || `${action.label}${row?.name ? ` ${row.name}` : ''}`}
                          disabled={action.disabled}
                          onClick={() => action.onClick?.(row)}
                        >
                          {action.icon && <span aria-hidden="true">{action.icon}</span>}
                          {action.label}
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export const Pagination = ({ page = 1, totalPages = 1, onChange, limit, onLimitChange }) => {
  const pageCount = Math.max(1, Number(totalPages) || 1);
  const currentPage = Math.min(Math.max(1, Number(page) || 1), pageCount);
  const pageOptions = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav className="admin-shared-pagination" aria-label="Navigasi halaman">
      <label className="admin-shared-page-size">
        <span>Baris per halaman</span>
        <select value={limit ?? 20} onChange={(event) => onLimitChange?.(Number(event.target.value))}>
          {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <div className="admin-shared-page-controls">
        <button type="button" onClick={() => onChange?.(1)} disabled={currentPage <= 1} aria-label="Halaman pertama">«</button>
        <button type="button" onClick={() => onChange?.(currentPage - 1)} disabled={currentPage <= 1} aria-label="Halaman sebelumnya">‹</button>
        <label>
          <span className="admin-shared-visually-hidden">Pilih halaman</span>
          <select value={currentPage} onChange={(event) => onChange?.(Number(event.target.value))}>
            {pageOptions.map((number) => <option key={number} value={number}>{number}</option>)}
          </select>
          <span>dari {pageCount}</span>
        </label>
        <button type="button" onClick={() => onChange?.(currentPage + 1)} disabled={currentPage >= pageCount} aria-label="Halaman berikutnya">›</button>
        <button type="button" onClick={() => onChange?.(pageCount)} disabled={currentPage >= pageCount} aria-label="Halaman terakhir">»</button>
      </div>
    </nav>
  );
};

export const Modal = ({ open, title, onClose, children, footer, className = '' }) => {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="admin-shared-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section ref={dialogRef} className={`admin-shared-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex="-1">
        <header className="admin-shared-modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="admin-shared-icon-button" aria-label="Tutup dialog" onClick={onClose}>×</button>
        </header>
        <div className="admin-shared-modal-body">{children}</div>
        {footer && <footer className="admin-shared-modal-footer">{footer}</footer>}
      </section>
    </div>
  );
};

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  danger = false,
  requireText,
  onConfirm,
  onCancel,
  busy = false
}) => {
  const [typedText, setTypedText] = useState('');
  const expectedText = typeof requireText === 'string' ? requireText : (requireText ? 'KONFIRMASI' : '');

  useEffect(() => {
    if (!open) setTypedText('');
  }, [open]);

  const footer = (
    <>
      <button type="button" className="admin-shared-button" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
      <button
        type="button"
        className={danger ? 'admin-shared-button is-danger' : 'admin-shared-button is-primary'}
        onClick={onConfirm}
        disabled={busy || (expectedText && typedText !== expectedText)}
      >
        {busy ? 'Memproses…' : confirmLabel}
      </button>
    </>
  );

  return (
    <Modal open={open} title={title} onClose={onCancel} footer={footer} className="admin-shared-confirm-dialog">
      <p>{message}</p>
      {expectedText && (
        <FormField label={`Ketik “${expectedText}” untuk melanjutkan`} name="confirmation-text">
          <input value={typedText} onChange={(event) => setTypedText(event.target.value)} autoComplete="off" />
        </FormField>
      )}
    </Modal>
  );
};

export const Toast = ({ toasts = [], onDismiss }) => (
  <div className="admin-shared-toast-region" aria-live="polite" aria-relevant="additions text">
    {toasts.map((toast) => (
      <div className={`admin-shared-toast is-${toast.type || 'success'}`} role={toast.type === 'error' ? 'alert' : 'status'} key={toast.id}>
        <span>{toast.message}</span>
        <button type="button" className="admin-shared-icon-button" aria-label="Tutup notifikasi" onClick={() => onDismiss?.(toast.id)}>×</button>
      </div>
    ))}
  </div>
);

export const useToast = ({ duration = 5000 } = {}) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismissToast = (id) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const showToast = ({ message, type = 'success', timeout = duration }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((current) => [...current, { id, message, type }]);
    if (timeout > 0) timers.current.set(id, setTimeout(() => dismissToast(id), timeout));
    return id;
  };

  useEffect(() => () => timers.current.forEach((timer) => clearTimeout(timer)), []);
  return { toasts, showToast, dismissToast };
};

export const EmptyState = ({ icon = '—', title = 'Belum ada data', description, action }) => (
  <div className="admin-shared-state admin-shared-empty">
    <span className="admin-shared-state-icon" aria-hidden="true">{icon}</span>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <button type="button" className="admin-shared-button is-primary" onClick={action.onClick}>{action.label}</button>}
  </div>
);

export const ErrorState = ({ error, onRetry, retryLabel = 'Coba lagi' }) => (
  <div className="admin-shared-state admin-shared-error" role="alert">
    <span className="admin-shared-state-icon" aria-hidden="true">!</span>
    <h3>Data gagal dimuat</h3>
    <p>{error?.message || error || 'Terjadi kesalahan. Silakan coba lagi.'}</p>
    {onRetry && <button type="button" className="admin-shared-button" onClick={onRetry}>{retryLabel}</button>}
  </div>
);

export const StatusBadge = ({ status, label }) => {
  const normalized = String(status || '').toLowerCase();
  const knownLabels = {
    active: 'Aktif', approved: 'Disetujui', pending: 'Menunggu', rejected: 'Ditolak',
    suspended: 'Ditangguhkan', inactive: 'Nonaktif', archived: 'Diarsipkan', cancelled: 'Dibatalkan'
  };
  const tone = ['active', 'approved'].includes(normalized) ? 'success'
    : ['pending'].includes(normalized) ? 'warning'
      : ['rejected', 'suspended', 'inactive', 'cancelled'].includes(normalized) ? 'danger' : 'neutral';
  return <span className={`admin-shared-status-badge is-${tone}`}>{label || knownLabels[normalized] || status || 'Tidak diketahui'}</span>;
};

export const FormField = ({ label, name, error, hint, required = false, children, ...labelProps }) => {
  const generatedId = useId();
  const inputId = labelProps.id || `admin-field-${generatedId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
      id: inputId,
      name: children.props.name || name,
      'aria-invalid': error ? 'true' : children.props['aria-invalid'],
      'aria-describedby': [children.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined
    })
    : children;

  return (
    <div className={`admin-shared-form-field${error ? ' has-error' : ''}`}>
      <label htmlFor={inputId}>
        {label}{required && <span aria-hidden="true"> *</span>}
      </label>
      {hint && <p className="admin-shared-field-hint" id={hintId}>{hint}</p>}
      {control}
      {error && <p className="admin-shared-field-error" id={errorId}>{error}</p>}
    </div>
  );
};

export default {
  DataToolbar,
  ResponsiveTable,
  Pagination,
  Modal,
  ConfirmDialog,
  Toast,
  useToast,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  FormField
};