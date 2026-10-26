import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

export const useGrievanceList = (endpoint, withDepts) => {
  const [sp, setSp] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, pending: 0, closed: 0, notProcessed: 0 });
  const [deptOptions, setDeptOptions] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  const list = (k) => (sp.get(k) || ``).split(',').filter(Boolean);
  const q = sp.get('q') || ``;
  const dept = list('dept');
  const urgency = list('urgency');
  const page = parseInt(sp.get('page')) || 1;
  const hasFilters = !!(q || dept.length || urgency.length);

  const setParams = (changes, keepPage = false) => {
    const next = new URLSearchParams(sp);
    Object.entries(changes).forEach(([k, v]) => { 
      if (!v) next.delete(k); 
      else next.set(k, v); 
    });
    if (!keepPage) next.delete('page');
    setSp(next, { replace: true });
  };

  const toggle = (key, cur, val) =>
    setParams({ [key]: (cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]).join(',') });

  const reset = () => setSp({}, { replace: true });

  const loadSummary = () => 
    api.get('/complaint/summary')
       .then((r) => setSummary(r.data))
       .catch(console.error);

  useEffect(() => {
    loadSummary();
    api.get('/filter-presets').then((r) => setPresets(r.data)).catch(console.error);
    if (withDepts) api.get('/complaintType/get-all').then((r) => setDeptOptions(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(endpoint, {
       params: {
         page, 
         q, 
         departments: dept.join(','), 
         urgency: urgency.join(',') } 
        })
      .then((r) => { 
        setComplaints(r.data.complaints); 
        setPagination(r.data.pagination); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, q, dept.join(), urgency.join()]);

  const savePreset = async () => {
    const name = window.prompt('Preset name?');
    if (!name) return;
    const r = await api.post('/filter-presets', { name, filters: { q, dept: dept.join(), urgency: urgency.join() } });
    setPresets((p) => [...p.filter((x) => x._id !== r.data._id), r.data]);
  };

  const applyPreset = (p) => {
    const next = new URLSearchParams();
    Object.entries(p.filters).forEach(([k, v]) => { if (v) next.set(k, v); });
    setSp(next, { replace: true });
  };

  const deletePreset = async (p) => {
    await api.delete(`/filter-presets/${p._id}`);
    setPresets((x) => x.filter((y) => y._id !== p._id));
  };

  return { 
    complaints, 
    setComplaints,
    pagination, 
    summary, 
    loadSummary, 
    loading, 
    deptOptions, 
    presets, 
    dept, 
    urgency, 
    hasFilters, 
    setParams, 
    toggle, 
    reset, 
    savePreset,
    applyPreset, 
    deletePreset 
  };
};

const B = ({ on, ...p }) => <button className={on ? 'btn btn-primary' : 'btn btn-outline'} {...p} />;

export const GrievanceFilters = ({ f }) => (
  <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
    <input 
      className="form-control" 
      placeholder="Search..." 
      value={f.q}
      onChange={(e) => f.setParams({ q: e.target.value })}
      style={{ maxWidth: '200px' }}
    />
    {['Low', 'Medium', 'High', 'Emergency'].map((u) => (
      <B key={u} on={f.urgency.includes(u)} onClick={() => f.toggle('urgency', f.urgency, u)}>{u}</B>
    ))}
    {f.deptOptions.map((d) => (
      <B key={d._id} on={f.dept.includes(d._id)} onClick={() => f.toggle('dept', f.dept, d._id)}>{d.name}</B>
    ))}
    {f.presets.map((p) => (
      <span key={p._id} style={{ display: 'inline-flex', gap: '2px' }}>
        <B onClick={() => f.applyPreset(p)}>{p.name}</B>
        <B onClick={() => f.deletePreset(p)}>x</B>
      </span>
    ))}
    <B disabled={!f.hasFilters} onClick={f.savePreset}>Save filters</B>
    {f.hasFilters && <B onClick={f.reset}>Reset filters</B>}
  </div>
);

export const GrievanceEmpty = ({ f }) => (
  <div style={{ padding: '3rem', textAlign: 'center' }}>
    <h4>{f.hasFilters ? 'No grievances match your filters' : 'No grievances found'}</h4>
    {f.hasFilters && <B on onClick={f.reset}>Reset filters</B>}
  </div>
);

export const GrievancePager = ({ f }) => {
  const { page, totalPages, total } = f.pagination;
  if (!total) return null;
  const go = (p) => f.setParams({ page: String(p) }, true);
  return (
    <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <B disabled={page <= 1} onClick={() => go(page - 1)}>Prev</B>
      <span>Page {page} of {totalPages}. {total} total</span>
      <B disabled={page >= totalPages} onClick={() => go(page + 1)}>Next</B>
    </div>
  );
};