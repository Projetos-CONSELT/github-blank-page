import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Headphones,
  Search,
  User,
  Package,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode,
  Hash,
  ArrowRight,
  Calendar,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Truck,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function Atendimento() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [allData, setAllData] = useState({ pessoas: [], solicitacoes: [], emprestimos: [], equipamentos: [] });
  const [loaded, setLoaded] = useState(false);

  const loadAll = async () => {
    try {
      const [pessoas, solicitacoes, emprestimos, equipamentos] = await Promise.all([
        base44.entities.Pessoa.list(),
        base44.entities.Solicitacao.list('-created_date'),
        base44.entities.Emprestimo.list('-created_date'),
        base44.entities.Equipamento.list(),
      ]);
      setAllData({ pessoas, solicitacoes, emprestimos, equipamentos });
      setLoaded(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setNotFound(false);
    setSearchResult(null);

    try {
      if (!loaded) await loadAll();

      const term = searchTerm.toLowerCase().trim();

      // Busca por protocolo de solicitação
      if (term.startsWith('sol-')) {
        const sol = allData.solicitacoes.find(s => s.protocolo?.toLowerCase() === term);
        if (sol) {
          const empRestimos = allData.emprestimos.filter(e => e.solicitacao_id === sol.id);
          const pessoa = allData.pessoas.find(p => p.id === sol.responsavel_id);
          setSearchResult({ type: 'solicitacao', solicitacao: sol, pessoa, emprestimos: empRestimos });
          setLoading(false);
          return;
        }
      }

      // Busca por código de equipamento
      const equip = allData.equipamentos.find(e => e.codigo?.toLowerCase() === term);
      if (equip) {
        const empAtivo = allData.emprestimos.find(e => e.equipamento_id === equip.id && (e.status === 'ativo' || e.status === 'vencendo' || e.status === 'vencido'));
        const pessoaEmp = empAtivo ? allData.pessoas.find(p => p.id === empAtivo.pessoa_id) : null;
        setSearchResult({ type: 'equipamento', equipamento: equip, emprestimo: empAtivo, pessoa: pessoaEmp });
        setLoading(false);
        return;
      }

      // Busca por pessoa (nome, CPF, WhatsApp)
      const pessoas = allData.pessoas.filter(p =>
        p.nome?.toLowerCase().includes(term) ||
        p.cpf?.includes(term) ||
        p.whatsapp?.includes(term) ||
        p.email?.toLowerCase().includes(term)
      );

      if (pessoas.length > 0) {
        const pessoa = pessoas[0];
        const solicitacoesPessoa = allData.solicitacoes.filter(s => s.responsavel_id === pessoa.id || s.beneficiario_id === pessoa.id);
        const emprestimosPessoa = allData.emprestimos.filter(e => e.pessoa_id === pessoa.id);
        setSearchResult({ type: 'pessoa', pessoa, solicitacoes: solicitacoesPessoa, emprestimos: emprestimosPessoa });
        setLoading(false);
        return;
      }

      setNotFound(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, type = 'solicitacao') => {
    if (type === 'emprestimo') {
      const config = {
        ativo: 'bg-emerald-100 text-emerald-700',
        vencendo: 'bg-yellow-100 text-yellow-700',
        vencido: 'bg-red-100 text-red-700',
        devolvido: 'bg-blue-100 text-blue-700',
      };
      return <Badge className={config[status] || 'bg-gray-100 text-gray-700'}>{status}</Badge>;
    }
    const config = {
      nova: 'bg-blue-100 text-blue-700',
      em_triagem: 'bg-yellow-100 text-yellow-700',
      em_fila: 'bg-purple-100 text-purple-700',
      reservado: 'bg-cyan-100 text-cyan-700',
      liberado_retirada: 'bg-green-100 text-green-700',
      concluida: 'bg-emerald-100 text-emerald-700',
      cancelada: 'bg-red-100 text-red-700',
    };
    return <Badge className={config[status] || 'bg-gray-100 text-gray-700'}>{status?.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Barra de busca principal */}
      <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Consulta Rápida de Atendimento</h2>
            <p className="text-slate-500 text-sm mt-1">Busque por CPF, nome, protocolo ou código do equipamento</p>
          </div>
          <div className="flex gap-3 max-w-xl mx-auto">
            <Input
              placeholder="Ex: João Silva / 123.456.789-00 / SOL-20240101-0001 / EQ-2024-0001"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="text-base h-12"
            />
            <Button onClick={handleSearch} disabled={loading} className="h-12 px-6 bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </div>
          <div className="flex gap-4 justify-center mt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><User className="w-3 h-3" />Nome ou CPF</span>
            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Protocolo SOL-</span>
            <span className="flex items-center gap-1"><Package className="w-3 h-3" />Código EQ-</span>
          </div>
        </CardContent>
      </Card>

      {/* Resultado: Não encontrado */}
      {notFound && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center text-red-700">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-60" />
            <p className="font-medium">Nenhum resultado encontrado para "{searchTerm}"</p>
            <p className="text-sm mt-1">Verifique os dados e tente novamente</p>
          </CardContent>
        </Card>
      )}

      {/* Resultado: Pessoa */}
      {searchResult?.type === 'pessoa' && (
        <div className="space-y-4">
          <Card className="border-blue-200">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-500/30 flex items-center justify-center">
                  <User className="w-7 h-7 text-blue-200" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">{searchResult.pessoa.nome}</CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge className={
                      searchResult.pessoa.status === 'ativo' ? 'bg-emerald-500/30 text-emerald-200 border-0' :
                      searchResult.pessoa.status === 'bloqueado' ? 'bg-red-500/30 text-red-200 border-0' :
                      'bg-yellow-500/30 text-yellow-200 border-0'
                    }>
                      {searchResult.pessoa.status}
                    </Badge>
                    {searchResult.pessoa.papeis?.map(p => (
                      <Badge key={p} className="bg-white/20 text-white border-0 capitalize">{p}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {searchResult.pessoa.cpf && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4" />
                    <span>{searchResult.pessoa.cpf}</span>
                  </div>
                )}
                {searchResult.pessoa.whatsapp && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    <span>{searchResult.pessoa.whatsapp}</span>
                  </div>
                )}
                {searchResult.pessoa.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span>{searchResult.pessoa.email}</span>
                  </div>
                )}
                {searchResult.pessoa.cidade && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span>{searchResult.pessoa.cidade}/{searchResult.pessoa.estado}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="solicitacoes">
            <TabsList>
              <TabsTrigger value="solicitacoes">
                Solicitações ({searchResult.solicitacoes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="emprestimos">
                Empréstimos ({searchResult.emprestimos?.length || 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="solicitacoes" className="mt-4">
              {searchResult.solicitacoes?.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-slate-500">Nenhuma solicitação</CardContent></Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {searchResult.solicitacoes.map(sol => (
                        <div key={sol.id} className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-medium">#{sol.protocolo}</p>
                            <p className="text-sm text-slate-500">{sol.tipo_equipamento_nome} • {moment(sol.created_date).format('DD/MM/YYYY')}</p>
                          </div>
                          {getStatusBadge(sol.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="emprestimos" className="mt-4">
              {searchResult.emprestimos?.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-slate-500">Nenhum empréstimo</CardContent></Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {searchResult.emprestimos.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-medium">{emp.equipamento_codigo} — {emp.tipo_equipamento_nome}</p>
                            <p className="text-sm text-slate-500">
                              Retirada: {moment(emp.data_retirada).format('DD/MM/YYYY')} •
                              Devolução: {moment(emp.data_prevista_devolucao).format('DD/MM/YYYY')}
                            </p>
                          </div>
                          {getStatusBadge(emp.status, 'emprestimo')}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Resultado: Solicitação */}
      {searchResult?.type === 'solicitacao' && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-300" />
                <div>
                  <CardTitle className="text-white">Solicitação #{searchResult.solicitacao.protocolo}</CardTitle>
                  <p className="text-slate-300 text-sm">{searchResult.solicitacao.tipo_equipamento_nome}</p>
                </div>
              </div>
              {getStatusBadge(searchResult.solicitacao.status)}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-500">Responsável</p><p className="font-medium">{searchResult.solicitacao.responsavel_nome}</p></div>
              <div><p className="text-slate-500">Data</p><p className="font-medium">{moment(searchResult.solicitacao.created_date).format('DD/MM/YYYY')}</p></div>
              {searchResult.solicitacao.data_limite_retirada && (
                <div><p className="text-slate-500">Limite Retirada</p><p className="font-medium">{moment(searchResult.solicitacao.data_limite_retirada).format('DD/MM/YYYY')}</p></div>
              )}
              {searchResult.solicitacao.motivo_status && (
                <div className="col-span-2"><p className="text-slate-500">Motivo</p><p className="font-medium">{searchResult.solicitacao.motivo_status}</p></div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado: Equipamento */}
      {searchResult?.type === 'equipamento' && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-300" />
                <div>
                  <CardTitle className="text-white">{searchResult.equipamento.codigo}</CardTitle>
                  <p className="text-slate-300 text-sm">{searchResult.equipamento.tipo_nome}</p>
                </div>
              </div>
              <Badge className={
                searchResult.equipamento.status === 'disponivel' ? 'bg-emerald-500/30 text-emerald-200 border-0' :
                searchResult.equipamento.status === 'emprestado' ? 'bg-blue-500/30 text-blue-200 border-0' :
                'bg-yellow-500/30 text-yellow-200 border-0'
              }>
                {searchResult.equipamento.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-500">Estado</p><p className="font-medium capitalize">{searchResult.equipamento.estado_conservacao}</p></div>
              <div><p className="text-slate-500">Localização</p><p className="font-medium">{searchResult.equipamento.localizacao || '—'}</p></div>
            </div>
            {searchResult.emprestimo && (
              <>
                <Separator />
                <div>
                  <p className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    Empréstimo Ativo
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-blue-50 rounded-lg">
                    <div><p className="text-slate-500">Pessoa</p><p className="font-medium">{searchResult.pessoa?.nome || '—'}</p></div>
                    <div><p className="text-slate-500">Status</p>{getStatusBadge(searchResult.emprestimo.status, 'emprestimo')}</div>
                    <div><p className="text-slate-500">Retirada</p><p className="font-medium">{moment(searchResult.emprestimo.data_retirada).format('DD/MM/YYYY')}</p></div>
                    <div><p className="text-slate-500">Devolução Prevista</p><p className="font-medium">{moment(searchResult.emprestimo.data_prevista_devolucao).format('DD/MM/YYYY')}</p></div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}