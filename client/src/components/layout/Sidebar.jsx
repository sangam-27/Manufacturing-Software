import React from 'react';
import { Icon, Avatar, Badge } from '../ui';

const NAV = [
  { section: 'Main', items: [
    { id:'dashboard',  icon:'dashboard', label:'Dashboard',          roles:['admin','supervisor','user'] },
  ]},
  { section: 'Operations', items: [
    { id:'production', icon:'production',label:'Production',         roles:['admin','supervisor','user'] },
    { id:'inventory',  icon:'inventory', label:'Inventory',          roles:['admin','supervisor'] },
    { id:'bom',        icon:'layers',    label:'Bill of Materials',   roles:['admin','supervisor'] },
    { id:'tasks',      icon:'tasks',     label:'My Tasks',            roles:['admin','supervisor','user'], badge:true },
  ]},
  { section: 'Procurement', items: [
    { id:'purchase',   icon:'package',   label:'Purchase Orders',    roles:['admin','supervisor'] },
    { id:'machines',   icon:'refresh',   label:'Machines',           roles:['admin','supervisor'] },
    { id:'shifts',     icon:'clock',     label:'Shift Scheduling',   roles:['admin','supervisor','user'] },
  ]},
  { section: 'Finance', items: [
    { id:'billing',    icon:'billing',   label:'Billing & Sales',    roles:['admin'] },
    { id:'reports',    icon:'chart',     label:'Reports & GST',      roles:['admin'] },
  ]},
  { section: 'Admin', items: [
    { id:'users',      icon:'users',     label:'User Management',    roles:['admin'] },
  ]},
];

export default function Sidebar({ current, onNav, user, collapsed, pendingTasks = 0 }) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-mark"><Icon name="package" size={18}/></div>
        {!collapsed && <div className="logo-text">Manufacture<span>OS</span></div>}
      </div>
      <nav className="sidebar-nav">
        {NAV.map(section => {
          const visible = section.items.filter(i => i.roles.includes(user.role));
          if (!visible.length) return null;
          return (
            <div key={section.section} className="nav-section">
              {!collapsed && <div className="nav-section-label">{section.section}</div>}
              {visible.map(item => (
                <div key={item.id}
                  className={`nav-item${current === item.id ? ' active' : ''}`}
                  onClick={() => onNav(item.id)}
                  title={collapsed ? item.label : ''}>
                  <Icon name={item.icon} size={17} style={{flexShrink:0}}/>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {!collapsed && item.badge && pendingTasks > 0 && (
                    <span className="nav-badge">{pendingTasks}</span>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="sidebar-user">
            <Avatar name={user.name} size={28} role={user.role}/>
            <div style={{overflow:'hidden',flex:1}}>
              <div style={{fontSize:12.5,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user.name}</div>
              <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'capitalize'}}>{user.role}</div>
            </div>
          </div>
        ) : (
          <div style={{display:'flex',justifyContent:'center'}}>
            <Avatar name={user.name} size={32} role={user.role}/>
          </div>
        )}
      </div>
    </aside>
  );
}
