import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Heart,
  Plus,
  Search,
  User,
  Package,
  Calendar,
  Loader2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Gift,
  CheckCircle,
  TrendingUp,
  Award
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
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function Doacoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [equipamentos, setEquipamentos] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [tiposEquipamento, setTiposEquipamento] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEquipamento, setSelectedEquipamento] = useState(null);

  const [formData, setFormData] = useState({
    doador_id: '',
    tipo_id: '',
    estado_conservacao: 'bom',
    data_doacao: moment().format('YYYY-MM-DD'),
    observacoes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [equips, pessoas, tipos] = await Promise.all([
        base44.entities.Equipamento.list('-created_date'),
        base44.entities.Pessoa.list(),
        base44.entities.TipoEquipamento.list(),
      ]);
      setEquipamentos(equips.filter(e => e.doador_id));
      setPessoas(pessoas);
      setTiposEquipamento(tipos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateCodigo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DOA-${year}-${random}`;
  };

  const handleSave = async () => {
    if (!formData.doador_id || !formData.tipo_id) return;
    setSaving(true);
    try {
      const doador = pessoas.find(p => p.id === formData.doador_id);
      const tipo = tiposEquipamento.find(t => t.id === formData.tipo_id);
      await base44.entities.Equipamento.create({
        codigo: generateCodigo(),
        tipo_id: formData.tipo_id,
        tipo_nome: tipo?.nome,
        doador_id: formData.doador_id,
        data_doacao: formData.data_doacao,
        estado_conservacao: formData.estado_conservacao,
        status: 'disponivel',
        observacoes: formData.observacoes,
      });
      await loadData();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (equip) => {
    if (!confirm('Excluir este registro de doação?')) return;
    await base44.entities.Equipamento.delete(equip.id);
    await loadData();
  };

  const filtered = equipamentos.filter(e =>
    !searchTerm ||
    e.tipo_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const doadoreUnicos = [...new Set(equipamentos.map(e => e.doador_id))].length;
  const mesTotalDoacoes = equipamentos.filter(e => moment(e.data_doacao).isSame(moment(), 'month')).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">Total de Doações</p>
              <p className="text-4xl font-bold">{equipamentos.length}</p>
            </div>
            <Heart className="w-12 h-12 text-pink-300" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm">Doadores Únicos</p>
              <p className="text-4xl font-bold">{doadoreUnicos}</p>
            </div>
            <Award className="w-12 h-12 text-violet-300" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Doações este Mês</p>
              <p className="text-4xl font-bold">{mesTotalDoacoes}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-amber-300" />
          </CardContent>
        </Card>
      </div>

      {/* Filtros e ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por tipo ou código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 bg-pink-600 hover:bg-pink-700">
          <Heart className="w-4 h-4" />
          Registrar Doação
        </Button>
      </div>

      {/* Ranking de Doadores */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top Doadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const contagem = equipamentos.reduce((acc, e) => {
                if (!e.doador_id) return acc;
                const doador = pessoas.find(p => p.id === e.doador_id);
                const nome = doador?.nome || 'Desconhecido';
                acc[e.doador_id] = { nome, count: (acc[e.doador_id]?.count || 0) + 1 };
                return acc;
              }, {});
              const ranking = Object.values(contagem).sort((a, b) => b.count - a.count).slice(0, 5);
              return ranking.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Nenhum doador ainda</p>
              ) : (
                <div className="space-y-3">
                  {ranking.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-slate-100 text-slate-600' :
                        'bg-orange-100 text-orange-700'
                      }`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.nome}</p>
                      </div>
                      <Badge className="bg-pink-100 text-pink-700">{d.count}</Badge>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Lista de doações */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Equipamentos Doados</CardTitle>
            <CardDescription>{filtered.length} registro(s)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma doação registrada</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(equip => {
                  const doador = pessoas.find(p => p.id === equip.doador_id);
                  return (
                    <div key={equip.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{equip.tipo_nome}</p>
                          <p className="text-sm text-slate-500">
                            {equip.codigo} • Doador: {doador?.nome || '—'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {equip.data_doacao ? moment(equip.data_doacao).format('DD/MM/YYYY') : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          equip.estado_conservacao === 'novo' ? 'bg-emerald-100 text-emerald-700' :
                          equip.estado_conservacao === 'bom' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }>
                          {equip.estado_conservacao === 'novo' ? 'Novo' :
                           equip.estado_conservacao === 'bom' ? 'Bom' : 'Regular'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedEquipamento(equip); setDetailModalOpen(true); }}>
                              <Eye className="w-4 h-4 mr-2" />Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(equip)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal nova doação */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Doação</DialogTitle>
            <DialogDescription>Cadastre um novo equipamento recebido por doação</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Doador *</Label>
              <Select value={formData.doador_id} onValueChange={v => setFormData({ ...formData, doador_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o doador" /></SelectTrigger>
                <SelectContent>
                  {pessoas.filter(p => p.papeis?.includes('doador')).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                  {pessoas.filter(p => !p.papeis?.includes('doador')).length > 0 && (
                    pessoas.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Equipamento *</Label>
              <Select value={formData.tipo_id} onValueChange={v => setFormData({ ...formData, tipo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {tiposEquipamento.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estado de Conservação</Label>
                <Select value={formData.estado_conservacao} onValueChange={v => setFormData({ ...formData, estado_conservacao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="necessita_manutencao">Necessita Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data da Doação</Label>
                <Input type="date" value={formData.data_doacao} onChange={e => setFormData({ ...formData, data_doacao: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Detalhes sobre a doação..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !formData.doador_id || !formData.tipo_id} className="bg-pink-600 hover:bg-pink-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Doação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Doação</DialogTitle>
          </DialogHeader>
          {selectedEquipamento && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div><p className="text-sm text-slate-500">Código</p><p className="font-medium">{selectedEquipamento.codigo}</p></div>
              <div><p className="text-sm text-slate-500">Tipo</p><p className="font-medium">{selectedEquipamento.tipo_nome}</p></div>
              <div><p className="text-sm text-slate-500">Doador</p><p className="font-medium">{pessoas.find(p => p.id === selectedEquipamento.doador_id)?.nome || '—'}</p></div>
              <div><p className="text-sm text-slate-500">Data</p><p className="font-medium">{selectedEquipamento.data_doacao ? moment(selectedEquipamento.data_doacao).format('DD/MM/YYYY') : '—'}</p></div>
              <div><p className="text-sm text-slate-500">Estado</p><p className="font-medium capitalize">{selectedEquipamento.estado_conservacao}</p></div>
              <div><p className="text-sm text-slate-500">Status</p><p className="font-medium capitalize">{selectedEquipamento.status}</p></div>
              {selectedEquipamento.observacoes && (
                <div className="col-span-2"><p className="text-sm text-slate-500">Observações</p><p className="font-medium">{selectedEquipamento.observacoes}</p></div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}