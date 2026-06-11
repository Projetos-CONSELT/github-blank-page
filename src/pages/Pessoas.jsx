import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit,
  Trash2,
  Eye,
  Loader2,
  X,
  Check,
  AlertCircle,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import moment from 'moment';

export default function Pessoas() {
  const [loading, setLoading] = useState(true);
  const [pessoas, setPessoas] = useState([]);
  const [filteredPessoas, setFilteredPessoas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [papelFilter, setPapelFilter] = useState('todos');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPessoa, setSelectedPessoa] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    whatsapp: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    papeis: [],
    status: 'ativo',
    motivo_status: '',
    observacoes: '',
  });

  useEffect(() => {
    loadPessoas();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      openNewModal();
    }
  }, []);

  useEffect(() => {
    filterPessoas();
  }, [pessoas, searchTerm, statusFilter, papelFilter]);

  const loadPessoas = async () => {
    try {
      const data = await base44.entities.Pessoa.list('-created_date');
      setPessoas(data);
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPessoas = () => {
    let filtered = [...pessoas];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.nome?.toLowerCase().includes(term) ||
        p.cpf?.includes(term) ||
        p.whatsapp?.includes(term) ||
        p.email?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (papelFilter !== 'todos') {
      filtered = filtered.filter(p => p.papeis?.includes(papelFilter));
    }

    setFilteredPessoas(filtered);
  };

  const openNewModal = () => {
    setFormData({
      nome: '',
      cpf: '',
      whatsapp: '',
      email: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      papeis: [],
      status: 'ativo',
      motivo_status: '',
      observacoes: '',
    });
    setIsEditing(false);
    setSelectedPessoa(null);
    setModalOpen(true);
  };

  const openEditModal = (pessoa) => {
    setFormData({
      nome: pessoa.nome || '',
      cpf: pessoa.cpf || '',
      whatsapp: pessoa.whatsapp || '',
      email: pessoa.email || '',
      endereco: pessoa.endereco || '',
      cidade: pessoa.cidade || '',
      estado: pessoa.estado || '',
      cep: pessoa.cep || '',
      papeis: pessoa.papeis || [],
      status: pessoa.status || 'ativo',
      motivo_status: pessoa.motivo_status || '',
      observacoes: pessoa.observacoes || '',
    });
    setIsEditing(true);
    setSelectedPessoa(pessoa);
    setModalOpen(true);
  };

  const openDetailModal = (pessoa) => {
    setSelectedPessoa(pessoa);
    setDetailModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) return;
    
    setSaving(true);
    try {
      if (isEditing && selectedPessoa) {
        await base44.entities.Pessoa.update(selectedPessoa.id, formData);
      } else {
        await base44.entities.Pessoa.create(formData);
      }
      await loadPessoas();
      setModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar pessoa:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pessoa) => {
    if (!confirm('Tem certeza que deseja excluir esta pessoa?')) return;
    
    try {
      await base44.entities.Pessoa.delete(pessoa.id);
      await loadPessoas();
    } catch (error) {
      console.error('Erro ao excluir pessoa:', error);
    }
  };

  const togglePapel = (papel) => {
    const current = formData.papeis || [];
    if (current.includes(papel)) {
      setFormData({ ...formData, papeis: current.filter(p => p !== papel) });
    } else {
      setFormData({ ...formData, papeis: [...current, papel] });
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      ativo: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700' },
      com_pendencia: { label: 'Com Pendência', className: 'bg-yellow-100 text-yellow-700' },
      bloqueado: { label: 'Bloqueado', className: 'bg-red-100 text-red-700' },
    };
    const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const getPapelBadge = (papel) => {
    const config = {
      responsavel: { label: 'Responsável', className: 'bg-blue-100 text-blue-700' },
      beneficiario: { label: 'Beneficiário', className: 'bg-purple-100 text-purple-700' },
      doador: { label: 'Doador', className: 'bg-amber-100 text-amber-700' },
    };
    const c = config[papel] || { label: papel, className: 'bg-gray-100 text-gray-700' };
    return <Badge key={papel} className={c.className}>{c.label}</Badge>;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por nome, CPF, WhatsApp ou e-mail..."
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
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="com_pendencia">Com Pendência</SelectItem>
              <SelectItem value="bloqueado">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={papelFilter} onValueChange={setPapelFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os papéis</SelectItem>
              <SelectItem value="responsavel">Responsável</SelectItem>
              <SelectItem value="beneficiario">Beneficiário</SelectItem>
              <SelectItem value="doador">Doador</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openNewModal} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Nova Pessoa
          </Button>
        </div>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {filteredPessoas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma pessoa encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPessoas.map((pessoa) => (
                <div 
                  key={pessoa.id} 
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {pessoa.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{pessoa.nome}</p>
                        {getStatusBadge(pessoa.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        {pessoa.cpf && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {pessoa.cpf}
                          </span>
                        )}
                        {pessoa.whatsapp && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {pessoa.whatsapp}
                          </span>
                        )}
                        {pessoa.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {pessoa.email}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {pessoa.papeis?.map(papel => getPapelBadge(papel))}
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
                      <DropdownMenuItem onClick={() => openDetailModal(pessoa)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(pessoa)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(pessoa)}
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

      {/* Modal de Cadastro/Edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Pessoa' : 'Nova Pessoa'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Atualize os dados da pessoa' : 'Preencha os dados para cadastrar uma nova pessoa'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="col-span-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Papéis</Label>
              <div className="flex gap-4">
                {['responsavel', 'beneficiario', 'doador'].map(papel => (
                  <div key={papel} className="flex items-center space-x-2">
                    <Checkbox
                      id={papel}
                      checked={formData.papeis?.includes(papel)}
                      onCheckedChange={() => togglePapel(papel)}
                    />
                    <label htmlFor={papel} className="text-sm cursor-pointer">
                      {papel === 'responsavel' ? 'Responsável' :
                       papel === 'beneficiario' ? 'Beneficiário' : 'Doador'}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="com_pendencia">Com Pendência</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.status !== 'ativo' && (
              <div>
                <Label>Motivo do Status</Label>
                <Textarea
                  value={formData.motivo_status}
                  onChange={(e) => setFormData({ ...formData, motivo_status: e.target.value })}
                  placeholder="Descreva o motivo..."
                />
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações internas..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.nome}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Detalhes da Pessoa
              {selectedPessoa && getStatusBadge(selectedPessoa.status)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPessoa && (
            <Tabs defaultValue="dados" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dados" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Nome</p>
                    <p className="font-medium">{selectedPessoa.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">CPF</p>
                    <p className="font-medium">{selectedPessoa.cpf || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">WhatsApp</p>
                    <p className="font-medium">{selectedPessoa.whatsapp || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">E-mail</p>
                    <p className="font-medium">{selectedPessoa.email || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Endereço</p>
                    <p className="font-medium">
                      {selectedPessoa.endereco ? 
                        `${selectedPessoa.endereco}, ${selectedPessoa.cidade || ''} - ${selectedPessoa.estado || ''}, ${selectedPessoa.cep || ''}` 
                        : '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Papéis</p>
                    <div className="flex gap-2 mt-1">
                      {selectedPessoa.papeis?.map(papel => getPapelBadge(papel))}
                      {(!selectedPessoa.papeis || selectedPessoa.papeis.length === 0) && '-'}
                    </div>
                  </div>
                  {selectedPessoa.observacoes && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500">Observações</p>
                      <p className="font-medium">{selectedPessoa.observacoes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="historico" className="mt-4">
                <div className="text-center py-8 text-slate-500">
                  <p>Histórico de solicitações e empréstimos</p>
                  <p className="text-sm">(Em desenvolvimento)</p>
                </div>
              </TabsContent>
              
              <TabsContent value="documentos" className="mt-4">
                <div className="text-center py-8 text-slate-500">
                  <p>Documentos anexados</p>
                  <p className="text-sm">(Em desenvolvimento)</p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setDetailModalOpen(false);
              openEditModal(selectedPessoa);
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