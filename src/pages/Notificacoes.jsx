import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Bell,
  Send,
  Plus,
  Search,
  Mail,
  MessageCircle,
  Smartphone,
  Monitor,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MoreVertical,
  Eye,
  Trash2,
  Filter,
  RefreshCw,
  User
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
import 'moment/locale/pt-br';

moment.locale('pt-br');

const CANAL_ICONS = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: Smartphone,
  sistema: Monitor,
};

const CANAL_COLORS = {
  email: 'bg-blue-100 text-blue-700',
  whatsapp: 'bg-emerald-100 text-emerald-700',
  sms: 'bg-violet-100 text-violet-700',
  sistema: 'bg-slate-100 text-slate-700',
};

export default function Notificacoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const [formData, setFormData] = useState({
    destinatario_id: '',
    destinatario_contato: '',
    canal: 'email',
    tipo: 'confirmacao',
    titulo: '',
    mensagem: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notifs, pess] = await Promise.all([
        base44.entities.Notificacao.list('-created_date', 100),
        base44.entities.Pessoa.list(),
      ]);
      setNotificacoes(notifs);
      setPessoas(pess);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.titulo || !formData.mensagem) return;
    setSaving(true);
    try {
      const pessoa = pessoas.find(p => p.id === formData.destinatario_id);
      const contato = formData.canal === 'email' ? pessoa?.email : pessoa?.whatsapp;

      await base44.entities.Notificacao.create({
        ...formData,
        destinatario_contato: formData.destinatario_contato || contato || '',
        status: 'enviado',
      });

      // Se for email, tentar enviar de verdade
      if (formData.canal === 'email' && (formData.destinatario_contato || pessoa?.email)) {
        try {
          await base44.integrations.Core.SendEmail({
            to: formData.destinatario_contato || pessoa?.email,
            subject: formData.titulo,
            body: formData.mensagem,
            from_name: 'Clube da Bengala',
          });
        } catch (e) {
          console.log('Email não enviado:', e);
        }
      }

      await loadData();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (notif) => {
    if (!confirm('Excluir esta notificação?')) return;
    await base44.entities.Notificacao.delete(notif.id);
    await loadData();
  };

  const handleResend = async (notif) => {
    setSaving(true);
    try {
      await base44.entities.Notificacao.update(notif.id, { status: 'enviado' });
      if (notif.canal === 'email' && notif.destinatario_contato) {
        await base44.integrations.Core.SendEmail({
          to: notif.destinatario_contato,
          subject: notif.titulo,
          body: notif.mensagem,
          from_name: 'Clube da Bengala',
        });
      }
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = notificacoes.filter(n => {
    const matchSearch = !searchTerm ||
      n.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.destinatario_contato?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'todos' || n.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    enviados: notificacoes.filter(n => n.status === 'enviado').length,
    pendentes: notificacoes.filter(n => n.status === 'pendente').length,
    falhou: notificacoes.filter(n => n.status === 'falhou').length,
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
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Enviados</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.enviados}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Com Falha</p>
              <p className="text-2xl font-bold text-red-600">{stats.falhou}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input placeholder="Buscar notificações..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="falhou">Falhou</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4" />
            Nova Notificação
          </Button>
        </div>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(notif => {
                const CanalIcon = CANAL_ICONS[notif.canal] || Bell;
                return (
                  <div key={notif.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                      <CanalIcon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900 text-sm">{notif.titulo}</p>
                        <Badge className={CANAL_COLORS[notif.canal] || 'bg-gray-100 text-gray-700'}>
                          {notif.canal}
                        </Badge>
                        <Badge className={
                          notif.status === 'enviado' ? 'bg-emerald-100 text-emerald-700' :
                          notif.status === 'falhou' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }>
                          {notif.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Para: {notif.destinatario_contato || '—'} • {moment(notif.created_date).fromNow()}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedNotif(notif); setDetailModalOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" />Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResend(notif)}>
                          <Send className="w-4 h-4 mr-2" />Reenviar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(notif)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Notificação */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Notificação</DialogTitle>
            <DialogDescription>Envie uma notificação para um beneficiário ou responsável</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Canal</Label>
                <Select value={formData.canal} onValueChange={v => setFormData({ ...formData, canal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="sistema">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={v => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmacao">Confirmação</SelectItem>
                    <SelectItem value="pendencia">Pendência</SelectItem>
                    <SelectItem value="reserva">Reserva</SelectItem>
                    <SelectItem value="vencimento">Vencimento</SelectItem>
                    <SelectItem value="devolucao">Devolução</SelectItem>
                    <SelectItem value="bloqueio">Bloqueio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Destinatário</Label>
              <Select value={formData.destinatario_id} onValueChange={v => {
                const p = pessoas.find(x => x.id === v);
                setFormData({ ...formData, destinatario_id: v, destinatario_contato: p?.email || p?.whatsapp || '' });
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione a pessoa" /></SelectTrigger>
                <SelectContent>
                  {pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contato (e-mail ou telefone)</Label>
              <Input value={formData.destinatario_contato} onChange={e => setFormData({ ...formData, destinatario_contato: e.target.value })} placeholder="email@exemplo.com ou (00) 00000-0000" />
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} placeholder="Assunto da notificação" />
            </div>
            <div>
              <Label>Mensagem *</Label>
              <Textarea value={formData.mensagem} onChange={e => setFormData({ ...formData, mensagem: e.target.value })} placeholder="Conteúdo da mensagem..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={saving || !formData.titulo || !formData.mensagem}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes da Notificação</DialogTitle></DialogHeader>
          {selectedNotif && (
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Canal</p><p className="font-medium capitalize">{selectedNotif.canal}</p></div>
                <div><p className="text-slate-500">Tipo</p><p className="font-medium capitalize">{selectedNotif.tipo}</p></div>
                <div><p className="text-slate-500">Status</p><p className="font-medium capitalize">{selectedNotif.status}</p></div>
                <div><p className="text-slate-500">Data</p><p className="font-medium">{moment(selectedNotif.created_date).format('DD/MM/YYYY HH:mm')}</p></div>
                <div className="col-span-2"><p className="text-slate-500">Destinatário</p><p className="font-medium">{selectedNotif.destinatario_contato}</p></div>
                <div className="col-span-2"><p className="text-slate-500">Título</p><p className="font-medium">{selectedNotif.titulo}</p></div>
                <div className="col-span-2"><p className="text-slate-500">Mensagem</p><p className="font-medium whitespace-pre-wrap">{selectedNotif.mensagem}</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailModalOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}