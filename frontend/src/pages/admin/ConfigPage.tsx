import { useState } from 'react'
import { Building2, Clock, Truck, Tag } from 'lucide-react'
import { GeneralTab } from '../../components/config/GeneralTab'
import { ScheduleTab } from '../../components/config/ScheduleTab'
import { SuppliersTab } from '../../components/config/SuppliersTab'
import { CategoriesTab } from '../../components/config/CategoriesTab'

type Tab = 'general' | 'horarios' | 'proveedores' | 'categorias'

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'general', label: 'Datos de la óptica', icon: <Building2 size={16} /> },
  { key: 'horarios', label: 'Horarios', icon: <Clock size={16} /> },
  { key: 'proveedores', label: 'Proveedores', icon: <Truck size={16} /> },
  { key: 'categorias', label: 'Categorías', icon: <Tag size={16} /> },
]

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Configuración
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Administra los datos y preferencias de la óptica
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 p-1 overflow-x-auto"
        style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '8px' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
            style={{
              backgroundColor: activeTab === tab.key ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: '6px',
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'general' && <GeneralTab />}
      {activeTab === 'horarios' && <ScheduleTab />}
      {activeTab === 'proveedores' && <SuppliersTab />}
      {activeTab === 'categorias' && <CategoriesTab />}
    </div>
  )
}
