import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Search, 
  Plus, 
  MoreVertical,
  Package,
  Tag,
  MapPin,
  Camera,
  Loader2,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Settings,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import moment from 'moment';

export default function Equipamentos() {
  const [loading, setLoading] = useState(true);
  const [equipamentos, setEquipamentos] = useState([]);
  const [filteredEquipamentos, setFilteredEquipamentos] = useState([]);
  const [tiposEquipamento, setTiposEquipamento] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [activeTab, setActiveTab] = useState('equipamentos');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoModalOpen, setTipoModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  const [selectedEquipamento, setSelectedEquipamento] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '',
    tipo_id: '',
    estado_conservacao: 'bom',
    status: 'disponivel',
    localizacao: '',
    observacoes: '',
  });

  const [tipoFormData, setTipoFormData] = useState({
    nome: '',
    descricao: '',
  });

  useEffect(() => {
    loadData();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      openNewModal();
    }
  }, []);

  useEffect(() => {
    filterEquipamentos();
  }, [equipamentos, searchTerm, statusFilter, tipoFilter]);

  const loadData = async () => {
    try {
      const [equipamentosData, tiposData] = await Promise.all([
        base44.entities.Equipamento.list('-created_date'),
        base44.entities.TipoEquipamento.list(),
      ]);
      setEquipamentos(equipamentosData);
      setTiposEquipamento(tiposData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEquipamentos = () => {
    let filtered = [...equipamentos];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.codigo?.toLowerCase().includes(term) ||
        e.tipo_nome?.toLowerCase().includes(term) ||
        e.localizacao?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(e => e.tipo_id === tipoFilter);
    }

    setFilteredEquipamentos(filtered);
  };

  const generateCodigo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EQ-${year}-${random}`;
  };

  const openNewModal = () => {
    setFormData({
      codigo: generateCodigo(),
      tipo_id: '',
      estado_conservacao: 'bom',
      status: 'disponivel',
      localizacao: '',
      observacoes: '',
    });
    setIsEditing(false);
    setSelectedEquipamento(null);
    setModalOpen(true);
  };

  const openEditModal = (equipamento) => {
    setFormData({
      codigo: equipamento.codigo || '',
      tipo_id: equipamento.tipo_id || '',
      estado_conservacao: equipamento.estado_conservacao || 'bom',
      status: equipamento.status || 'disponivel',
      localizacao: equipamento.localizacao || '',
      observacoes: equipamento.observacoes || '',
    });
    setIsEditing(true);
    setSelectedEquipamento(equipamento);
    setModalOpen(true);
  };

  const openDetailModal = (equipamento) => {
    setSelectedEquipamento(equipamento);
    setDetailModalOpen(true);
  };

  const openNewTipoModal = () => {
    setTipoFormData({ nome: '', descricao: '' });
    setTipoModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.codigo || !formData.tipo_id) return;
    
    setSaving(true);
    try {
      const tipo = tiposEquipamento.find(t => t.id === formData.tipo_id);
      const data = {
        ...formData,
        tipo_nome: tipo?.nome,
      };

      if (isEditing && selectedEquipamento) {
        await base44.entities.Equipamento.update(selectedEquipamento.id, data);
      } else {
        await base44.entities.Equipamento.create(data);
      }
      await loadData();
      setModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTipo = async () => {
    if (!tipoFormData.nome) return;
    
    setSaving(true);
    try {
      await base44.entities.TipoEquipamento.create({
        ...tipoFormData,
        ativo: true,
      });
      await loadData();
      setTipoModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar tipo:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (equipamento) => {
    if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;
    
    try {
      await base44.entities.Equipamento.delete(equipamento.id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir equipamento:', error);
    }
  };

  const handleDeleteTipo = async (tipo) => {
    if (!confirm('Tem certeza que deseja excluir este tipo?')) return;
    
    try {
      await base44.entities.TipoEquipamento.delete(tipo.id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir tipo:', error);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      disponivel: { label: 'Disponível', className: 'bg-emerald-100 text-emerald-700' },
      reservado: { label: 'Reservado', className: 'bg-cyan-100 text-cyan-700' },
      emprestado: { label: 'Emprestado', className: 'bg-blue-100 text-blue-700' },
      vendido: { label: 'Vendido', className: 'bg-purple-100 text-purple-700' },
      extraviado: { label: 'Extraviado', className: 'bg-red-100 text-red-700' },
      manutencao: { label: 'Manutenção', className: 'bg-yellow-100 text-yellow-700' },
    };
    const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const getEstadoBadge = (estado) => {
    const config = {
      novo: { label: 'Novo', className: 'bg-emerald-100 text-emerald-700' },
      bom: { label: 'Bom', className: 'bg-blue-100 text-blue-700' },
      regular: { label: 'Regular', className: 'bg-yellow-100 text-yellow-700' },
      necessita_manutencao: { label: 'Necessita Manutenção', className: 'bg-red-100 text-red-700' },
    };
    const c = config[estado] || { label: estado, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  // Contadores
  const statusCounts = {
    disponivel: equipamentos.filter(e => e.status === 'disponivel').length,
    reservado: equipamentos.filter(e => e.status === 'reservado').length,
    emprestado: equipamentos.filter(e => e.status === 'emprestado').length,
    manutencao: equipamentos.filter(e => e.status === 'manutencao').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de Equipamento</TabsTrigger>
        </TabsList>

        <TabsContent value="equipamentos" className="space-y-6 mt-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('disponivel')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Disponíveis</p>
                    <p className="text-2xl font-bold text-emerald-600">{statusCounts.disponivel}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('reservado')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Reservados</p>
                    <p className="text-2xl font-bold text-cyan-600">{statusCounts.reservado}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('emprestado')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Emprestados</p>
                    <p className="text-2xl font-bold text-blue-600">{statusCounts.emprestado}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('manutencao')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Manutenção</p>
                    <p className="text-2xl font-bold text-yellow-600">{statusCounts.manutencao}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar por código, tipo ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="emprestado">Emprestado</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="extraviado">Extraviado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {tiposEquipamento.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={openNewModal} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Novo Equipamento
              </Button>
            </div>
          </div>

          {/* Lista */}
          <Card>
            <CardContent className="p-0">
              {filteredEquipamentos.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum equipamento encontrado</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredEquipamentos.map((equipamento) => (
                    <div 
                      key={equipamento.id} 
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Package className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{equipamento.codigo}</p>
                            {getStatusBadge(equipamento.status)}
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">{equipamento.tipo_nome || 'Sem tipo'}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            {equipamento.localizacao && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {equipamento.localizacao}
                              </span>
                            )}
                            <span>{getEstadoBadge(equipamento.estado_conservacao)}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetailModal(equipamento)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(equipamento)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(equipamento)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tipos" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Tipos de Equipamento</h3>
              <p className="text-sm text-slate-500">Gerencie os tipos de equipamentos disponíveis</p>
            </div>
            <Button onClick={openNewTipoModal} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Novo Tipo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiposEquipamento.map(tipo => (
              <Card key={tipo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{tipo.nome}</p>
                        <p className="text-sm text-slate-500">{tipo.descricao || 'Sem descrição'}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTipo(tipo)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-slate-500">
                      {equipamentos.filter(e => e.tipo_id === tipo.id).length} equipamento(s)
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tiposEquipamento.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum tipo cadastrado</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Equipamento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Atualize os dados do equipamento' : 'Cadastre um novo equipamento no estoque'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Código *</Label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="EQ-2024-0001"
              />
            </div>

            <div>
              <Label>Tipo de Equipamento *</Label>
              <Select 
                value={formData.tipo_id} 
                onValueChange={(v) => setFormData({ ...formData, tipo_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposEquipamento.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estado de Conservação</Label>
                <Select 
                  value={formData.estado_conservacao} 
                  onValueChange={(v) => setFormData({ ...formData, estado_conservacao: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="necessita_manutencao">Necessita Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="reservado">Reservado</SelectItem>
                    <SelectItem value="emprestado">Emprestado</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="vendido">Vendido</SelectItem>
                    <SelectItem value="extraviado">Extraviado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Localização</Label>
              <Input
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Ex: Depósito Central, Prateleira A3"
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre o equipamento..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.codigo || !formData.tipo_id}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Tipo de Equipamento */}
      <Dialog open={tipoModalOpen} onOpenChange={setTipoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Tipo de Equipamento</DialogTitle>
            <DialogDescription>
              Cadastre um novo tipo de equipamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={tipoFormData.nome}
                onChange={(e) => setTipoFormData({ ...tipoFormData, nome: e.target.value })}
                placeholder="Ex: Cadeira de Rodas, Muleta, Andador"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={tipoFormData.descricao}
                onChange={(e) => setTipoFormData({ ...tipoFormData, descricao: e.target.value })}
                placeholder="Descrição do tipo de equipamento..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTipoModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveTipo} 
              disabled={saving || !tipoFormData.nome}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEquipamento?.codigo}
              {selectedEquipamento && getStatusBadge(selectedEquipamento.status)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEquipamento && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Tipo</p>
                  <p className="font-medium">{selectedEquipamento.tipo_nome || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Estado</p>
                  <p className="font-medium">{getEstadoBadge(selectedEquipamento.estado_conservacao)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Localização</p>
                  <p className="font-medium">{selectedEquipamento.localizacao || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Cadastrado em</p>
                  <p className="font-medium">{moment(selectedEquipamento.created_date).format('DD/MM/YYYY')}</p>
                </div>
                {selectedEquipamento.observacoes && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Observações</p>
                    <p className="font-medium">{selectedEquipamento.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setDetailModalOpen(false);
              openEditModal(selectedEquipamento);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}