import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Settings,
  Building2,
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  MoreVertical,
  Shield,
  Clock,
  FileText,
  Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';

export default function Configuracoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubes, setClubes] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [clubeModalOpen, setClubeModalOpen] = useState(false);
  const [selectedClube, setSelectedClube] = useState(null);
  const [isEditingClube, setIsEditingClube] = useState(false);

  const [clubeFormData, setClubeFormData] = useState({
    nome: '',
    cidade: '',
    estado: '',
    endereco: '',
    telefone: '',
    email: '',
    prazo_reserva_dias: 7,
    prazo_emprestimo_dias: 90,
    limite_renovacoes: 3,
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clubesData, usersData] = await Promise.all([
        base44.entities.Clube.list(),
        base44.entities.User.list(),
      ]);
      setClubes(clubesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewClubeModal = () => {
    setClubeFormData({
      nome: '',
      cidade: '',
      estado: '',
      endereco: '',
      telefone: '',
      email: '',
      prazo_reserva_dias: 7,
      prazo_emprestimo_dias: 90,
      limite_renovacoes: 3,
      ativo: true,
    });
    setIsEditingClube(false);
    setSelectedClube(null);
    setClubeModalOpen(true);
  };

  const openEditClubeModal = (clube) => {
    setClubeFormData({
      nome: clube.nome || '',
      cidade: clube.cidade || '',
      estado: clube.estado || '',
      endereco: clube.endereco || '',
      telefone: clube.telefone || '',
      email: clube.email || '',
      prazo_reserva_dias: clube.prazo_reserva_dias || 7,
      prazo_emprestimo_dias: clube.prazo_emprestimo_dias || 90,
      limite_renovacoes: clube.limite_renovacoes || 3,
      ativo: clube.ativo !== false,
    });
    setIsEditingClube(true);
    setSelectedClube(clube);
    setClubeModalOpen(true);
  };

  const handleSaveClube = async () => {
    if (!clubeFormData.nome || !clubeFormData.cidade || !clubeFormData.estado) return;
    
    setSaving(true);
    try {
      if (isEditingClube && selectedClube) {
        await base44.entities.Clube.update(selectedClube.id, clubeFormData);
        toast.success('Clube atualizado com sucesso!');
      } else {
        await base44.entities.Clube.create(clubeFormData);
        toast.success('Clube cadastrado com sucesso!');
      }
      await loadData();
      setClubeModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar clube:', error);
      toast.error('Erro ao salvar clube');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClube = async (clube) => {
    if (!confirm('Tem certeza que deseja excluir este clube?')) return;
    
    try {
      await base44.entities.Clube.delete(clube.id);
      toast.success('Clube excluído com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir clube:', error);
      toast.error('Erro ao excluir clube');
    }
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
      <Tabs defaultValue="clubes">
        <TabsList>
          <TabsTrigger value="clubes">Clubes</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        </TabsList>

        {/* Clubes */}
        <TabsContent value="clubes" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Clubes / Unidades</h3>
              <p className="text-sm text-slate-500">Gerencie os clubes e unidades do sistema</p>
            </div>
            <Button onClick={openNewClubeModal} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Novo Clube
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {clubes.map(clube => (
              <Card key={clube.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{clube.nome}</p>
                          <Badge className={clube.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                            {clube.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">{clube.cidade} - {clube.estado}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditClubeModal(clube)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClube(clube)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold text-blue-600">{clube.prazo_reserva_dias || 7}</p>
                      <p className="text-xs text-slate-500">dias reserva</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-emerald-600">{clube.prazo_emprestimo_dias || 90}</p>
                      <p className="text-xs text-slate-500">dias empréstimo</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-violet-600">{clube.limite_renovacoes || 3}</p>
                      <p className="text-xs text-slate-500">renovações</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {clubes.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum clube cadastrado</p>
                <Button onClick={openNewClubeModal} variant="outline" className="mt-4">
                  Cadastrar primeiro clube
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Usuários */}
        <TabsContent value="usuarios" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
              <p className="text-sm text-slate-500">Gerencie os usuários e permissões</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {users.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name || 'Usuário'}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parâmetros */}
        <TabsContent value="parametros" className="space-y-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold">Parâmetros Gerais</h3>
            <p className="text-sm text-slate-500">Configure os parâmetros padrão do sistema</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Prazos Padrão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Prazo de Reserva</p>
                    <p className="text-sm text-slate-500">Dias para retirada após reserva</p>
                  </div>
                  <Badge>7 dias</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Prazo de Empréstimo</p>
                    <p className="text-sm text-slate-500">Período padrão de empréstimo</p>
                  </div>
                  <Badge>90 dias</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Limite de Renovações</p>
                    <p className="text-sm text-slate-500">Máximo de renovações permitidas</p>
                  </div>
                  <Badge>3 vezes</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Regras de Bloqueio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Bloqueio por Inadimplência</p>
                    <p className="text-sm text-slate-500">Bloquear após vencimento</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Dias de Tolerância</p>
                    <p className="text-sm text-slate-500">Antes de aplicar bloqueio</p>
                  </div>
                  <Badge>15 dias</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Auditoria */}
        <TabsContent value="auditoria" className="space-y-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold">Logs de Auditoria</h3>
            <p className="text-sm text-slate-500">Histórico de alterações no sistema</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Logs de auditoria serão exibidos aqui</p>
                <p className="text-sm mt-2">As alterações são registradas automaticamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Clube */}
      <Dialog open={clubeModalOpen} onOpenChange={setClubeModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditingClube ? 'Editar Clube' : 'Novo Clube'}</DialogTitle>
            <DialogDescription>
              {isEditingClube ? 'Atualize os dados do clube' : 'Cadastre uma nova unidade/clube'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={clubeFormData.nome}
                onChange={(e) => setClubeFormData({ ...clubeFormData, nome: e.target.value })}
                placeholder="Nome do clube"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cidade *</Label>
                <Input
                  value={clubeFormData.cidade}
                  onChange={(e) => setClubeFormData({ ...clubeFormData, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label>Estado *</Label>
                <Input
                  value={clubeFormData.estado}
                  onChange={(e) => setClubeFormData({ ...clubeFormData, estado: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label>Endereço</Label>
              <Input
                value={clubeFormData.endereco}
                onChange={(e) => setClubeFormData({ ...clubeFormData, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={clubeFormData.telefone}
                  onChange={(e) => setClubeFormData({ ...clubeFormData, telefone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  value={clubeFormData.email}
                  onChange={(e) => setClubeFormData({ ...clubeFormData, email: e.target.value })}
                  placeholder="email@clube.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Prazo Reserva (dias)</Label>
                <Input
                  type="number"
                  value={clubeFormData.prazo_reserva_dias}
                  onChange={(e) => setClubeFormData({ ...clubeFormData, prazo_reserva_dias: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Prazo Empréstimo (dias)</Label>
                <Input
                  type="number"
                  value={clubeFormData.prazo_emprestimo_dias}
                  onChange={(e) => setClubeFormData({ ...clubeFormData, prazo_emprestimo_dias: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Limite Renovações</Label>
                <Input
                  type="number"
                  value={clubeFormData.limite_renovacoes}
                  onChange={(e) => setClubeFormData({ ...clubeFormData, limite_renovacoes: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={clubeFormData.ativo}
                onCheckedChange={(checked) => setClubeFormData({ ...clubeFormData, ativo: checked })}
              />
              <Label>Clube ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClubeModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveClube} 
              disabled={saving || !clubeFormData.nome || !clubeFormData.cidade || !clubeFormData.estado}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditingClube ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}