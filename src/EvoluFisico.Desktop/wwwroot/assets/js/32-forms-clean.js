

/* EvoluFisico2 — Formulários funcionais integrados ao protótipo.
 * Não substitui funções do aplicativo, não injeta CSS nem reescreve relatórios anteriores.
 * Dados novos separados; persistência somente cifrada com cofre desbloqueado.
 */
(function () {
'use strict';
const STORAGE_KEY='ef-forms-v1';
const PAGE='tab-ef-forms', NAV='tab-btn-ef-forms';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const num=v=>{if(v===''||v===null||v===undefined)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
const iso=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const validISO=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const [y,m,d]=value.split('-').map(Number);const q=new Date(Date.UTC(y,m-1,d));return q.getUTCFullYear()===y&&q.getUTCMonth()===m-1&&q.getUTCDate()===d};
const addDays=(value,n)=>{if(!validISO(value)||!Number.isInteger(+n)||+n<1||+n>365)throw Error('Data ou intervalo inválidos (1–365 dias).');const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+Number(n));return d.toISOString().slice(0,10)};
const daysBetween=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
const fmt=value=>validISO(value)?value.split('-').reverse().join('/'): '—';
const csv=v=>{let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};
const METRICS={peso:{label:'Peso',unit:'kg',get:a=>num(a.peso)},cintura:{label:'Cintura',unit:'cm',get:a=>num(a.perimetria?.cintura??a.cintura)},gordura:{label:'% de gordura (Pollock)',unit:'%',get:a=>num(a.dobras_resultado?.percGordura)},imc:{label:'IMC (BIA)',unit:'kg/m²',get:a=>num(a.bioimpedancia?.imc)},musculo:{label:'Massa muscular esquelética',unit:'kg',get:a=>num(a.bioimpedancia?.mme)}};
const fresh=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'ef2_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
const blank=()=>({schedules:[],templates:[],responses:[],goals:[],reportFields:['nome','data','peso','cintura','gordura','imc'],notes:''});
let state=blank(), demo=[], view='models', activeClientId='', memoryAlert=true, isBusy=false;
const auth=()=>window.EF_Security;
const isVaultReady=()=>Boolean(window.EFNativeStorage&&typeof window.EFNativeStorage.readJSON==='function'&&typeof window.EFNativeStorage.writeJSON==='function');
const hasVault=()=>isVaultReady();
function message(msg,error=false){const status=$(PAGE+'-status');if(status){status.textContent=msg;status.setAttribute('role',error?'alert':'status')}if(error)console.warn('[EF2 Extras]',msg)}
function getRecords(){const ar=Array.isArray(window.avaliacoes)?window.avaliacoes:[];return ar.concat(demo)}
function clientKey(a){if(a.__demoKey)return a.__demoKey;if(window.EFIdentity?.key)return String(window.EFIdentity.key(a));return String(a.cliente_id||a.id||'sem-identificador')}
function clients(){const groups=new Map();for(const a of getRecords()){const key=clientKey(a);if(!groups.has(key))groups.set(key,{id:key,name:a.nome||'Sem nome',records:[]});groups.get(key).records.push(a)}return [...groups.values()].map(g=>{g.records.sort((a,b)=>String(b.data_avaliacao||'').localeCompare(String(a.data_avaliacao||'')));return g}).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))}
function client(id){return clients().find(c=>c.id===id)}

// Cinco modelos originais: não reproduzem questionários proprietários e não emitem laudo clínico.
const PRESETS=[
 {id:'builtin-inicial',level:'iniciante',title:'Anamnese inicial e objetivos',description:'Cadastro, objetivos e experiência com exercícios.',questions:[
 'Qual é sua ocupação e como costuma ser seu dia de trabalho?',
 'Qual é seu principal objetivo com a prática de exercícios?',
 'Você pratica exercícios atualmente? Quais e com que frequência?',
 'Há quanto tempo não realiza uma avaliação física?',
 'Quais atividades você gosta ou prefere evitar?',
 'Quantos dias por semana pode dedicar aos exercícios?',
 'Qual é a sua maior dificuldade para manter uma rotina ativa?',
 'Há alguma informação adicional que deseja compartilhar?']},
 {id:'builtin-prontidao',level:'intermediario',title:'Prontidão para a prática de exercícios',description:'Perguntas gerais de orientação; não substitui o PAR-Q+ oficial nem avaliação médica.',questions:[
 'Algum profissional de saúde recomendou limitar sua atividade física? Explique.',
 'Você tem alguma condição de saúde que exija acompanhamento durante exercícios?',
 'Apresenta desconforto, falta de ar incomum ou tontura ao se exercitar?',
 'Teve alguma indisposição recente que afete seu treinamento?',
 'Usa medicamentos que possam influenciar disposição, pulso ou pressão? Quais?',
 'Já precisou interromper uma sessão por mal-estar? Descreva.',
 'Tem indicação de acompanhamento profissional ou autorização médica específica?',
 'Que cuidados devem ser considerados antes de iniciar o programa?']},
 {id:'builtin-saude',level:'intermediario',title:'Histórico de saúde e medicamentos',description:'Informações gerais de saúde para contextualizar o atendimento.',questions:[
 'Você possui alguma condição de saúde diagnosticada? Qual?',
 'Fez alguma cirurgia ou internação relevante? Quando?',
 'Usa medicamentos de modo contínuo? Quais e em quais horários?',
 'Tem alergias ou reações importantes que o profissional deva conhecer?',
 'Já realizou acompanhamento médico ou fisioterapêutico relacionado à atividade física?',
 'Há mudanças recentes em sua saúde ou em seus exames?',
 'Como costuma descrever seu nível de energia ao longo da semana?',
 'Deseja informar alguma restrição recomendada por profissional de saúde?']},
 {id:'builtin-lesoes',level:'intermediario',title:'Lesões, dores e limitações de movimento',description:'Histórico de queixas musculoesqueléticas e cuidados relatados.',questions:[
 'Você sente dor ou desconforto em alguma região do corpo atualmente?',
 'Quando começou o desconforto e em quais atividades ele aparece?',
 'Já teve fraturas, entorses ou lesões musculares ou articulares?',
 'Fez cirurgia ortopédica ou fisioterapia? Qual foi o motivo?',
 'Algum movimento ou exercício agrava seus sintomas?',
 'Tem limitações para caminhar, subir escadas, agachar ou levantar objetos?',
 'Existe orientação profissional sobre movimentos que devem ser evitados?',
 'Que adaptações ajudam você a se movimentar com conforto?']},
 {id:'builtin-habitos',level:'iniciante',title:'Hábitos, rotina e atividade física',description:'Rotina semanal inspirada nos domínios trabalho, deslocamento e lazer abordados pela OMS.',questions:[
 'Quantos dias da semana você realiza atividade física no trabalho ou em tarefas domésticas?',
 'Quanto tempo costuma caminhar ou pedalar para se deslocar?',
 'Quais exercícios ou esportes costuma praticar no tempo livre?',
 'Quantos dias da semana você pratica atividades mais intensas?',
 'Por quanto tempo, em média, você permanece sentado por dia?',
 'Como avalia a regularidade e a qualidade do seu sono?',
 'Como organiza pausas, alimentação e hidratação durante o dia?',
 'Que mudança de hábito você deseja priorizar nos próximos meses?']}

 ,{id:'builtin-iniciacao',level:'iniciante',title:'Primeiro contato e disponibilidade',description:'Exemplo simples para conhecer preferências, disponibilidade e motivação.',questions:[
 'O que motivou você a procurar avaliação física neste momento?',
 'Como é um dia comum de trabalho ou estudo para você?',
 'Qual atividade física já experimentou e de qual mais gostou?',
 'Quantos dias na semana você gostaria de se exercitar?',
 'Existe algum horário em que sente mais disposição para se movimentar?',
 'Quais mudanças você gostaria de perceber nos próximos três meses?',
 'Algum profissional de saúde orientou restrição à atividade física?',
 'Gostaria de comentar algo para que o atendimento seja mais confortável?']}
 ,{id:'builtin-saude-ampliada',level:'avancado',title:'Anamnese ampliada e fatores de atenção',description:'Exemplo aprofundado para histórico de saúde e encaminhamentos; não constitui diagnóstico.',questions:[
 'Quais diagnósticos ou condições de saúde são relevantes para o acompanhamento?',
 'Existe histórico de atendimento emergencial durante esforço físico? Descreva.',
 'Quais medicamentos você usa e houve mudanças recentes?',
 'Há recomendações médicas ou fisioterapêuticas documentadas? Quais?',
 'Quais sintomas durante esforço exigem interrupção da atividade, segundo seu histórico?',
 'Houve cirurgia, internação ou lesão relevante nos últimos doze meses?',
 'Como evoluíram sono, fadiga, dor e disposição nas últimas quatro semanas?',
 'Existe alguma avaliação médica pendente antes do início ou progressão do treinamento?',
 'Que adaptações ou supervisões específicas foram recomendadas?']}
 ,{id:'builtin-rendimento',level:'avancado',title:'Histórico de treinamento e desempenho',description:'Exemplo detalhado de cargas, frequência, recuperação e metas de desempenho.',questions:[
 'Quais modalidades ou modalidades competitivas você pratica atualmente?',
 'Como está distribuída sua rotina semanal de treinos e descanso?',
 'Quais são suas metas mensuráveis de desempenho e em que prazo?',
 'Que método utiliza para registrar volume, intensidade ou percepção de esforço?',
 'Qual foi a evolução recente de carga e tolerância ao treinamento?',
 'Já precisou interromper treinos por excesso de fadiga ou queda de desempenho?',
 'Como avalia a qualidade do sono e o tempo de recuperação entre sessões?',
 'Quais movimentos, exercícios ou modalidades apresentam maior dificuldade?',
 'Existe orientação de outro profissional que deva ser integrada ao planejamento?',
 'Que dados gostaria de comparar na próxima avaliação?']}
 ,{id:'builtin-evolucao',level:'avancado',title:'Anamnese de acompanhamento aprofundado',description:'Exemplo para atualizar medidas, sintomas, adesão e mudanças na rotina ao longo do tempo.',questions:[
 'Quais metas foram definidas na avaliação anterior e quais foram alcançadas?',
 'Que mudanças percebeu na disposição ou na capacidade funcional?',
 'Quais foram as maiores dificuldades para manter o programa?',
 'Houve alteração de medicação, diagnóstico ou orientação de saúde?',
 'Sentiu dor, desconforto ou sintomas diferentes durante exercícios?',
 'Quais atividades se tornaram mais fáceis ou mais difíceis?',
 'Houve mudanças relevantes no trabalho, no sono ou no nível de estresse?',
 'Como você avalia sua recuperação entre as sessões?',
 'Que resultados gostaria de priorizar para o próximo ciclo?',
 'Há algum dado ou acompanhamento de outro profissional a considerar?']}
 ].map(t=>({...t,questions:t.questions.map(label=>({label})),builtin:true}));const templates=()=>PRESETS.concat(state.templates);
const templateBy=id=>templates().find(x=>x.id===id);

function optionClients(selected=''){return clients().map(c=>`<option value="${esc(c.id)}" ${selected===c.id?'selected':''}>${esc(c.name)} · ${c.records.length} avaliação(ões) · ref. ${esc(c.id.slice(-8))}</option>`).join('')}
function chooser(id,extra='',selected=''){return `<div class="input-group"><label for="${id}">Aluno cadastrado</label><select id="${id}" class="form-control" required><option value="">Selecione um aluno cadastrado</option>${optionClients(selected)}</select>${extra}</div>`}
function requireClient(){const id=$('ef2x-main-client')?.value||activeClientId;const c=client(id);if(!c){message('Escolha um aluno já cadastrado antes de responder ou gerar o PDF da anamnese.',true);$('ef2x-main-client')?.focus();return null}activeClientId=c.id;return c}
function errText(){return isVaultReady()?'Dados dos formulários protegidos pelo SQLite criptografado do Windows (AES-GCM e DPAPI).':'Armazenamento nativo indisponível: não será possível salvar novas anamneses até restaurar a conexão com o SQLite.'}
async function loadEncrypted(){
 if(!isVaultReady()){message(errText(),true);return false}
 try{
  const record=await window.EFNativeStorage.readJSON(STORAGE_KEY);
  if(record===null){message('Nenhum formulário salvo neste dispositivo ainda.');return true}
  if(!record||!Array.isArray(record.schedules)||!Array.isArray(record.templates)||!Array.isArray(record.responses)||!Array.isArray(record.goals))throw Error('Registro nativo inválido: preserve o banco e restaure um backup.');
  state={...blank(),...record};
  render();message('Anamneses carregadas do banco SQLite protegido.');return true;
 }catch(e){message('Falha ao ler as anamneses do SQLite: '+e.message,true);return false}
}
async function commit(){
 if(!isVaultReady())throw Error('Banco SQLite protegido indisponível: nenhum dado foi salvo.');
 const result=await window.EFNativeStorage.writeJSON(STORAGE_KEY,state);
 if(result!=='saved')throw Error('O banco nativo não confirmou a gravação.');
 message('Anamneses e modelos salvos no SQLite criptografado do Windows.');
 return true
}
async function mutate(action){
 if(isBusy)return false;
 isBusy=true;const previous=JSON.stringify(state);
 try{await action();await commit();render();return true}
 catch(e){state=JSON.parse(previous);
  // A falha de gravação NÃO pode exibir falso sucesso nem apagar respostas ainda no editor.
  if(view!=='builder'&&view!=='fill')render();
  message('Operação não concluída: '+e.message,true);return false
 }finally{isBusy=false}
}
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};

// Geração de PDF AcroForm em JavaScript puro (offline). Campos editáveis de texto.
function pdfForm(t, person=null){const name=person?.name||'';const internalId=person?.id||'';
 const clean=v=>String(v??'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/[\u2022\u00B7]/g,'-').replace(/[\u0100-\uFFFF]/g,c=>c.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x00-\xFF]/g,'?'));
 const literal=v=>'('+clean(v).replace(/[\\()]/g,c=>'\\'+c).replace(/[\r\n]/g,' ').slice(0,220)+')';
 const obj=[null],reserve=()=>{obj.push('');return obj.length-1},set=(id,value)=>obj[id]=value;
 const catalog=reserve(),pages=reserve(),form=reserve(),regular=reserve(),bold=reserve();
 set(regular,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 set(bold,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
 const pageIds=[],fieldIds=[],questions=t.questions.map(q=>q.label).slice(0,12);const groups=[];for(let i=0;i<questions.length;i+=6)groups.push(questions.slice(i,i+6));
 for(let n=0;n<groups.length;n++){
   const pid=reserve(),contentId=reserve(),annots=[],draw=[];
   const write=(x,y,txt,font=regular,size=11)=>draw.push('BT /F'+(font===bold?'2':'1')+' '+size+' Tf 1 0 0 1 '+x+' '+y+' Tm '+literal(txt)+' Tj ET');
   draw.push('.12 .32 .25 rg 0 793 595 49 re f');draw.push('1 1 1 rg');
   write(36,810,'EvoluFisico - Anamnese',bold,17);draw.push('0 0 0 rg');
   const titleWords=clean(t.title).split(' '),titleLines=[''];for(const w of titleWords){const j=titleLines.length-1;if((titleLines[j]+' '+w).trim().length>62&&titleLines.length<2)titleLines.push(w);else titleLines[j]=(titleLines[j]+' '+w).trim()};
   titleLines.forEach((line,i)=>write(38,759-i*15,line,bold,13));write(38,733,'Nome:',regular,10);
   if(n===0){const nf=reserve();fieldIds.push(nf);annots.push(nf);set(nf,'<< /Type /Annot /Subtype /Widget /FT /Tx /Ff 1 /F 4 /T (nome_cliente) /TU (Nome do aluno cadastrado) /V '+literal(name)+' /Rect [77 728 550 741] /P '+pid+' 0 R /DA (/Helv 10 Tf 0 g) /MK << /BC [.65 .7 .65] /BG [1 1 1] >> /BS << /W .5 /S /S >> >>');const ident=reserve();fieldIds.push(ident);annots.push(ident);set(ident,'<< /Type /Annot /Subtype /Widget /FT /Tx /Ff 1 /F 2 /T (id_cliente) /TU (Identificador interno do aluno) /V '+literal(internalId)+' /Rect [0 0 0 0] /P '+pid+' 0 R /DA (/Helv 10 Tf 0 g) >>')}
   
   write(38,710,'Data: ____ / ____ / ______     Pagina '+(n+1)+' de '+groups.length,regular,9);
   draw.push('.8 .84 .82 RG 38 705 m 556 705 l S');
   groups[n].forEach((question,i)=>{
      const y=675-i*94;const fid=reserve();fieldIds.push(fid);annots.push(fid);
      const global=n*6+i+1;
      const words=clean(question).split(' '),lines=[''];for(const word of words){let j=lines.length-1;if((lines[j]+' '+word).trim().length>88&&lines.length<2)lines.push(word);else lines[j]=(lines[j]+' '+word).trim()};lines.forEach((line,k)=>write(40,y-k*12,(k?'':global+'. ')+line,bold,10));
      const bottom=y-69,top=y-(lines.length>1?25:12);
      set(fid,'<< /Type /Annot /Subtype /Widget /FT /Tx /Ff 4096 /F 4 /T '+literal('resposta_'+global)+' /TU '+literal(question)+' /V () /Rect [40 '+bottom+' 552 '+top+'] /P '+pid+' 0 R /DA (/Helv 10 Tf 0 g) /MK << /BC [.55 .65 .59] /BG [1 1 1] >> /BS << /W 1 /S /S >> >>');
   });
   write(38,75,'Preenchimento pelo cliente. Envie o PDF preenchido ao profissional responsavel.',regular,9);
   write(38,55,'Este formulario e informativo e nao substitui avaliacao ou autorizacao medica.',regular,8);
   const stream=draw.join('\n')+'\n';set(contentId,'<< /Length '+stream.length+' >>\nstream\n'+stream+'endstream');
   set(pid,'<< /Type /Page /Parent '+pages+' 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 '+regular+' 0 R /F2 '+bold+' 0 R >> >> /Contents '+contentId+' 0 R /Annots ['+annots.map(id=>id+' 0 R').join(' ')+'] >>');pageIds.push(pid);
 }
 set(pages,'<< /Type /Pages /Kids ['+pageIds.map(id=>id+' 0 R').join(' ')+'] /Count '+pageIds.length+' >>');
 set(form,'<< /Fields ['+fieldIds.map(id=>id+' 0 R').join(' ')+'] /NeedAppearances true /DA (/Helv 10 Tf 0 g) /DR << /Font << /Helv '+regular+' 0 R >> >> >>');
 set(catalog,'<< /Type /Catalog /Pages '+pages+' 0 R /AcroForm '+form+' 0 R >>');
 let pdf='%PDF-1.4\n%EF2\n',offsets=[0];for(let i=1;i<obj.length;i++){offsets[i]=pdf.length;pdf+=i+' 0 obj\n'+obj[i]+'\nendobj\n'}const start=pdf.length;
 pdf+='xref\n0 '+obj.length+'\n0000000000 65535 f \n';for(let i=1;i<obj.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 pdf+='trailer\n<< /Size '+obj.length+' /Root '+catalog+' 0 R >>\nstartxref\n'+start+'\n%%EOF\n';
 const bytes=new Uint8Array(pdf.length);for(let i=0;i<pdf.length;i++)bytes[i]=pdf.charCodeAt(i)&255;
 return bytes;
}
function exportFormPDF(id){
 const t=templateBy(id),c=requireClient();if(!t||!c)return;
 const safePart=v=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').slice(0,45);
 const file='EvoluFisico_Anamnese_'+safePart(c.name)+'_'+safePart(t.title)+'.pdf';
 safeDownload(file,'application/pdf',pdfForm(t,c));message('PDF preenchível associado a '+c.name+' gerado. O cliente pode responder no leitor compatível e devolver. O PDF não é criptografado.');
}

function safeDownload(file,type,content){const blob=new Blob([content],{type});const u=URL.createObjectURL(blob);const a=el('a');a.href=u;a.download=file;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}

/* Formulários — navegação simplificada, vínculo por identificador de cliente e formulário PDF editável. */
function iconSvg(name){const icons={file:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',people:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6"/><path d="M17 8h4M19 6v4"/>',check:'<path d="m4 12 5 5L20 6"/>',plus:'<path d="M12 5v14M5 12h14"/>',archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M10 13h4"/>',arrow:'<path d="m14 6-6 6 6 6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',download:'<path d="M12 3v12m-4-4 4 4 4-4M4 18v3h16v-3"/>',edit:'<path d="m4 20 4.2-1L19 8a2.2 2.2 0 0 0-3.1-3.1L5 15.8 4 20ZM14 7l3 3"/>',trash:'<path d="M4 7h16M10 3h4M6 7l1 14h10l1-14M10 11v7M14 11v7"/>'};return `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.file}</svg>`}
let editingTemplateId='',activeTemplateId='',openResponseId='',searchTerm='',levelFilter='todos';
let draft={title:'',description:'',level:'iniciante',questions:[{label:'',type:'long'}]};
const questionTypes={long:'Resposta detalhada',short:'Texto curto',yesno:'Sim ou não',number:'Número'};
const qt=q=>questionTypes[q.type]?q.type:'long';
const LEVELS={iniciante:'Iniciante',intermediario:'Intermediário',avancado:'Avançado'};
const levelOf=t=>LEVELS[t?.level]?t.level:'intermediario';
function setDraft(t){editingTemplateId=t?.id?.startsWith('builtin-')?'':(t?.id||'');draft={title:t?String(t.title)+(t.id?.startsWith('builtin-')?' (personalizado)':''):'',description:t?.description||'',level:t?levelOf(t):'iniciante',questions:t?.questions?.map(q=>({label:String(q.label||''),type:qt(q)}))||[{label:'',type:'long'}]};if(!draft.questions.length)draft.questions=[{label:'',type:'long'}]}
function clientHeader(){if(activeClientId&&!client(activeClientId))activeClientId='';const c=client(activeClientId);return `<section class="ef2f-client"><div class="ef2f-client-symbol">${iconSvg('people')}</div><div class="ef2f-client-field"><label for="ef2x-main-client">Aluno vinculado ao formulário</label><select id="ef2x-main-client" class="form-control"><option value="">Selecione o aluno cadastrado</option>${optionClients(activeClientId)}</select></div><div class="ef2f-client-state">${c?`<strong>${esc(c.name)}</strong><span>${c.records.length} avaliação(ões) · ID ${esc(c.id.slice(-8))}</span>`:`<strong>Vínculo obrigatório</strong><span>Selecione um aluno antes de responder ou gerar PDF</span>`}</div></section>`}
function emptyCard(title,description,cta=''){return `<div class="ef2f-empty">${iconSvg('archive')}<h3>${esc(title)}</h3><p>${esc(description)}</p>${cta}</div>`}
function init(){
 if($(PAGE))return;
 const nav=document.querySelector('.top-navbar > .nav-tabs'),main=document.querySelector('.app-container');
 if(!nav||!main||typeof window.switchTab!=='function')return;
 const button=el('button','nav-tab-btn');button.id=NAV;button.type='button';button.textContent='Formulários';button.setAttribute('aria-controls',PAGE);
 button.addEventListener('click',()=>{view='models';window.switchTab(PAGE);render()});const calc=$('tab-btn-lab77');if(calc&&calc.parentElement===nav)calc.insertAdjacentElement('afterend',button);else nav.append(button);
 const tab=el('section','tab-panel');tab.id=PAGE;main.append(tab);
 tab.innerHTML=`<div class="ef2f-shell"><div class="ef2f-header"><div><div class="ef2f-eyebrow">GESTÃO DE ANAMNESES</div><h1>Formulários</h1><p>Escolha um modelo, vincule ao aluno e registre respostas de forma organizada.</p></div></div>
 <div id="${PAGE}-alert" class="ef2f-security"></div>${clientHeader()}
 <nav class="ef2f-tabs" aria-label="Seções de formulários"><button type="button" data-ef2-page="models">${iconSvg('file')}<span>Modelos</span></button><button type="button" data-ef2-page="responses">${iconSvg('archive')}<span>Respostas</span></button><button type="button" data-ef2-page="builder">${iconSvg('plus')}<span>Criar formulário</span></button></nav>
 <div id="${PAGE}-status" class="ef2f-status" aria-live="polite" role="status"></div><div id="${PAGE}-content"></div></div>`;
 tab.addEventListener('click',onClick);tab.addEventListener('submit',onSubmit);
 tab.addEventListener('change',e=>{if(e.target.id==='ef2x-main-client'){activeClientId=client(e.target.value)?.id||'';if(view==='fill'&&!activeClientId)view='models';render();}else if(e.target.id==='ef2x-t-level'){draft.level=LEVELS[e.target.value]?e.target.value:'iniciante';}else if(e.target.id==='ef2x-t-level'){draft.level=LEVELS[e.target.value]?e.target.value:'iniciante'}else if(e.target.matches('[data-ef2-type]')){const index=Number(e.target.dataset.ef2Type);if(draft.questions[index])draft.questions[index].type=e.target.value;}});
 tab.addEventListener('input',e=>{if(e.target.id==='ef2x-model-search'){const p=e.target.selectionStart;searchTerm=e.target.value;renderModels($(`${PAGE}-content`),true);const field=$('ef2x-model-search');if(field){field.focus();field.setSelectionRange(p,p)}return}
 if(e.target.id==='ef2x-t-title')draft.title=e.target.value;
 if(e.target.id==='ef2x-t-description')draft.description=e.target.value;
 if(e.target.dataset.ef2Question!==undefined){const index=Number(e.target.dataset.ef2Question);if(draft.questions[index])draft.questions[index].label=e.target.value;}});
 window.EFSimpleUI?.arrangeNavigation?.();render();if(isVaultReady())loadEncrypted();
 window.addEventListener('ef-records-changed',()=>{if($(PAGE)?.classList.contains('active'))render()});
}
function render(){const root=$(`${PAGE}-content`);if(!root)return;
 const alert=$(`${PAGE}-alert`);if(alert)alert.innerHTML=`<span aria-hidden="true">${isVaultReady()?'●':'○'}</span> ${esc(errText())}`;
 const clientbar=$(PAGE)?.querySelector('.ef2f-client');if(clientbar)clientbar.outerHTML=clientHeader();
 $(PAGE)?.querySelectorAll('[data-ef2-page]').forEach(x=>{const selected=x.dataset.ef2Page===(view==='fill'?'models':view==='response-detail'?'responses':view);x.classList.toggle('is-active',selected);x.setAttribute('aria-current',selected?'page':'false')});
 if(view==='models')renderModels(root);else if(view==='responses')renderResponses(root);else if(view==='builder')renderBuilder(root);else if(view==='fill')renderFill(root);else if(view==='response-detail')renderResponseDetail(root);else view='models',renderModels(root);
}
function renderModels(root,preserveSearch=false){
 const query=searchTerm.toLocaleLowerCase('pt-BR').trim();
 const all=templates();
 const matching=all.filter(t=>{
  const kind=levelOf(t);
  if(levelFilter==='meus'&&t.builtin)return false;
  if(levelFilter!=='todos'&&levelFilter!=='meus'&&levelFilter!==kind)return false;
  return (t.title+' '+(t.description||'')+' '+LEVELS[kind]).toLocaleLowerCase('pt-BR').includes(query);
 });
 const own=state.templates.length;
 const counts={todos:all.length,iniciante:0,intermediario:0,avancado:0,meus:own};
 all.forEach(t=>counts[levelOf(t)]++);
 const card=t=>{const level=levelOf(t);return `<article class="ef2f-card ef2f-model" data-model-level="${level}"><div class="ef2f-model-top"><div class="ef2f-symbol">${iconSvg('file')}</div><span class="ef2f-tag">${esc(LEVELS[level])} · ${t.builtin?'Exemplo pronto':'Meu modelo'}</span></div><h3>${esc(t.title)}</h3><p>${esc(t.description||'Questionário criado pelo profissional.')}</p><div class="ef2f-model-footer"><span>${t.questions.length} perguntas</span><div><button type="button" class="btn btn-primary" data-ef2-action="fillTemplate" data-id="${esc(t.id)}">Preencher</button><button type="button" class="btn btn-secondary" data-ef2-action="exportPDF" data-id="${esc(t.id)}" aria-label="Gerar PDF de ${esc(t.title)}">${iconSvg('download')} PDF</button></div></div><div class="ef2f-model-sub"><button type="button" data-ef2-action="copyTemplate" data-id="${esc(t.id)}">${iconSvg('edit')} ${t.builtin?'Personalizar modelo':'Editar modelo'}</button>${t.builtin?'':`<button type="button" data-ef2-action="removeTemplate" data-id="${esc(t.id)}">${iconSvg('trash')} Excluir</button>`}</div></article>`};
 const ordered=['iniciante','intermediario','avancado'];
 const descriptions={iniciante:'Primeiro contato, objetivos e hábitos. Perguntas acessíveis e abrangentes.',intermediario:'Histórico de saúde, prontidão e limitações. Maior detalhamento.',avancado:'Acompanhamento aprofundado, desempenho e fatores que exigem atenção profissional.'};
 const chosen=levelFilter==='todos'?ordered:levelFilter==='meus'?ordered:[levelFilter];
 const groups=chosen.map(level=>{const items=matching.filter(t=>levelOf(t)===level);if(!items.length)return '';return `<section class="ef2f-level-block" aria-label="Anamneses ${LEVELS[level]}"><div class="ef2f-level-heading"><div><span class="ef2f-level-kicker">${esc(LEVELS[level])}</span><h3>${esc(LEVELS[level])}</h3><p>${esc(descriptions[level])}</p></div><span class="ef2f-pill">${items.length} modelo(s)</span></div><div class="ef2f-model-grid">${items.map(card).join('')}</div></section>`}).join('');
 const filters=[['todos','Todos'],['iniciante','Iniciante'],['intermediario','Intermediário'],['avancado','Avançado'],['meus','Meus modelos']].map(([k,label])=>`<button type="button" class="ef2f-level-filter ${levelFilter===k?'active':''}" data-ef2-level="${k}" aria-pressed="${levelFilter===k}">${label} <small>${counts[k]}</small></button>`).join('');
 root.innerHTML=`<div class="ef2f-sectionhead"><div><h2>Biblioteca de anamneses</h2><p>Escolha a profundidade do questionário. O nível se refere às perguntas, não à experiência física do aluno.</p></div><span class="ef2f-pill">${PRESETS.length} modelos prontos · ${own} próprio(s)</span></div><div class="ef2f-level-filters" role="group" aria-label="Filtrar anamneses por complexidade">${filters}</div><div class="ef2f-toolbar"><label class="ef2f-search">${iconSvg('search')}<input id="ef2x-model-search" type="search" autocomplete="off" placeholder="Buscar anamnese" value="${esc(searchTerm)}" aria-label="Buscar modelo de anamnese"/></label><button type="button" class="btn btn-secondary" data-ef2-page="builder">${iconSvg('plus')} Novo modelo</button></div>${groups||emptyCard('Nenhum modelo encontrado','Altere o filtro ou a pesquisa, ou crie uma anamnese personalizada.')}<p class="ef2f-note">Todos os modelos são exemplos autorais para coleta de informações, não classificam o condicionamento do aluno e não substituem triagem oficial nem orientação médica. O PDF é vinculado ao aluno selecionado.</p>`;
 if(!preserveSearch)window.scrollTo?.({top:0,behavior:'instant'});
}
function renderFill(root){const t=templateBy(activeTemplateId),c=client(activeClientId);if(!t){view='models';renderModels(root);return}
 const qtInput=(q,i)=>{const name=`ans_${i}`,id=`ef2x-q-${i}`;const kind=qt(q);let field=kind==='yesno'?`<select id="${id}" name="${name}" required><option value="">Selecione</option><option>Sim</option><option>Não</option><option>Não sei informar</option></select>`:kind==='number'?`<input id="${id}" name="${name}" type="number" step="any" required/>`:kind==='short'?`<input id="${id}" name="${name}" type="text" maxlength="200" required/>`:`<textarea id="${id}" name="${name}" rows="3" maxlength="600" required></textarea>`;return `<div class="ef2f-question"><div class="ef2f-q-index">${String(i+1).padStart(2,'0')}</div><div class="ef2f-q-body"><label for="${id}">${esc(q.label)}</label>${field}</div></div>`};
 root.innerHTML=`<button type="button" class="ef2f-back" data-ef2-page="models">${iconSvg('arrow')} Voltar aos modelos</button><div class="ef2f-sectionhead"><div><span class="ef2f-eyebrow">PREENCHIMENTO</span><h2>${esc(t.title)}</h2><p>${t.questions.length} perguntas · As respostas serão vinculadas ao cadastro selecionado.</p></div><button type="button" class="btn btn-secondary" data-ef2-action="exportPDF" data-id="${esc(t.id)}">${iconSvg('download')} PDF preenchível</button></div><div class="ef2f-paper">${c?`<div class="ef2f-filled-client">${iconSvg('check')} Aluno: <strong>${esc(c.name)}</strong> · cadastro ${esc(c.id.slice(-8))}</div>`:emptyCard('Selecione um aluno','Escolha o aluno cadastrado no campo acima para habilitar o registro das respostas.')}<form data-ef2-submit="response" data-template-id="${esc(t.id)}" data-client-id="${esc(c?.id||'')}">${t.questions.map(qtInput).join('')}<div class="ef2f-form-footer"><span>Informações de saúde devem ser tratadas com confidencialidade.</span><button class="btn btn-primary" type="submit" ${c?'':'disabled'}>Salvar respostas do aluno</button></div></form></div>`;
}
function renderResponses(root){let entries=state.responses.filter(r=>!activeClientId||r.clientId===activeClientId).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));const c=client(activeClientId);
 const rows=entries.map(r=>{const t=templateBy(r.templateId),p=client(r.clientId);return `<article class="ef2f-response"><div class="ef2f-symbol">${iconSvg('file')}</div><div><strong>${esc(r.templateTitle||t?.title||'Anamnese')}</strong><span>${esc(p?.name||r.clientName||'Aluno indisponível')} · ${fmt(r.date)} · ${Object.keys(r.answers||{}).length} respostas</span></div><button type="button" class="btn btn-secondary" data-ef2-action="openResponse" data-id="${esc(r.id)}">Visualizar</button></article>`}).join('');
 root.innerHTML=`<div class="ef2f-sectionhead"><div><h2>Histórico de respostas</h2><p>${c?'Exibindo formulários de '+esc(c.name):'Selecione um aluno para filtrar ou consulte todos os registros.'}</p></div><span class="ef2f-pill">${entries.length} registro(s)</span></div><div class="ef2f-paper">${rows||emptyCard('Nenhuma resposta registrada','Escolha um modelo, selecione o aluno e preencha a primeira anamnese.', '<button class="btn btn-primary" data-ef2-page="models">Explorar modelos</button>')}</div>`;
}
function renderResponseDetail(root){const r=state.responses.find(x=>x.id===openResponseId);if(!r){view='responses';renderResponses(root);return}const t=templateBy(r.templateId),qs=r.questions||t?.questions||[],c=client(r.clientId);const questions=qs.map((q,i)=>`<div class="ef2f-answer"><small>${String(i+1).padStart(2,'0')} · ${esc(q.label)}</small><p>${esc(r.answers?.[i]||'—')}</p></div>`).join('');
 root.innerHTML=`<button type="button" class="ef2f-back" data-ef2-page="responses">${iconSvg('arrow')} Voltar ao histórico</button><div class="ef2f-sectionhead"><div><span class="ef2f-eyebrow">REGISTRO DE ANAMNESE</span><h2>${esc(r.templateTitle||t?.title||'Formulário preenchido')}</h2><p>${esc(c?.name||r.clientName||'Aluno não encontrado')} · ${fmt(r.date)} · ID ${esc(r.clientId.slice(-8))}</p></div></div><div class="ef2f-paper"><div class="ef2f-filled-client">${iconSvg('check')} Respostas associadas ao identificador permanente do cadastro</div>${questions||emptyCard('Sem questões salvas','Este registro não possui perguntas disponíveis.')}</div>`;
}
function builderQuestion(q,i){return `<div class="ef2f-question ef2f-builder-row"><div class="ef2f-q-index">${String(i+1).padStart(2,'0')}</div><div class="ef2f-q-body"><label for="ef2x-build-q${i}">Pergunta ${i+1}</label><input id="ef2x-build-q${i}" data-ef2-question="${i}" type="text" maxlength="120" placeholder="Escreva a pergunta com clareza" value="${esc(q.label)}" required/><div class="ef2f-build-meta"><label for="ef2x-build-type${i}">Tipo de resposta</label><select id="ef2x-build-type${i}" data-ef2-type="${i}">${Object.entries(questionTypes).map(([k,v])=>`<option value="${k}" ${qt(q)===k?'selected':''}>${v}</option>`).join('')}</select><div><button class="ef2f-mini" type="button" data-ef2-action="upQuestion" data-index="${i}" ${i===0?'disabled':''} aria-label="Mover pergunta para cima">↑</button><button class="ef2f-mini" type="button" data-ef2-action="downQuestion" data-index="${i}" ${i===draft.questions.length-1?'disabled':''} aria-label="Mover pergunta para baixo">↓</button><button class="ef2f-mini" type="button" data-ef2-action="removeQuestion" data-index="${i}" ${draft.questions.length===1?'disabled':''} aria-label="Remover pergunta">×</button></div></div></div></div>`}
function renderBuilder(root){root.innerHTML=`<div class="ef2f-sectionhead"><div><span class="ef2f-eyebrow">EDITOR DE FORMULÁRIOS</span><h2>${editingTemplateId?'Editar modelo':'Criar formulário'}</h2><p>Organize as perguntas e escolha como o aluno responderá. Até 12 perguntas.</p></div><span class="ef2f-pill">${draft.questions.length} / 12 perguntas</span></div><div class="ef2f-paper"><form data-ef2-submit="template"><div class="ef2f-form-head"><div class="ef2f-field"><label for="ef2x-t-title">Nome do formulário *</label><input id="ef2x-t-title" required maxlength="80" placeholder="Ex.: Anamnese de corrida" value="${esc(draft.title)}"/></div><div class="ef2f-field"><label for="ef2x-t-level">Nível do questionário *</label><select id="ef2x-t-level" required><option value="iniciante" ${draft.level==='iniciante'?'selected':''}>Iniciante — perguntas essenciais</option><option value="intermediario" ${draft.level==='intermediario'?'selected':''}>Intermediário — histórico mais detalhado</option><option value="avancado" ${draft.level==='avancado'?'selected':''}>Avançado — acompanhamento aprofundado</option></select><small>O nível descreve o formulário, não o condicionamento físico do aluno.</small></div><div class="ef2f-field"><label for="ef2x-t-description">Descrição (opcional)</label><textarea id="ef2x-t-description" rows="2" maxlength="160" placeholder="Para qual finalidade esse modelo será utilizado?">${esc(draft.description)}</textarea></div></div><div class="ef2f-builder-heading"><div><h3>Perguntas</h3><p>Defina um título objetivo e um formato de resposta.</p></div><button type="button" class="btn btn-secondary" data-ef2-action="addQuestion" ${draft.questions.length>=12?'disabled':''}>${iconSvg('plus')} Adicionar pergunta</button></div>${draft.questions.map(builderQuestion).join('')}<div class="ef2f-form-footer"><button class="btn btn-secondary" type="button" data-ef2-action="cancelBuilder">Cancelar</button><button class="btn btn-primary" type="submit">${editingTemplateId?'Salvar alterações':'Salvar modelo'}</button></div></form></div>`;}
function updateBuilder(){if(view==='builder')renderBuilder($(`${PAGE}-content`))}
async function onSubmit(e){const form=e.target.closest('[data-ef2-submit]');if(!form)return;e.preventDefault();const kind=form.dataset.ef2Submit;
 if(kind==='template'){
  const name=String(draft.title||'').trim(),description=String(draft.description||'').trim();const level=LEVELS[draft.level]?draft.level:'iniciante';const questions=draft.questions.map(q=>({label:String(q.label||'').trim(),type:qt(q)}));
  if(!name||name.length>80||questions.length<1||questions.length>12||questions.some(q=>!q.label||q.label.length>120)){message('Informe um título e de 1 a 12 perguntas preenchidas (até 120 caracteres cada).',true);return}
  const prior=editingTemplateId,alreadyAnswered=state.responses.some(r=>r.templateId===prior);
  const saved=await mutate(()=>{if(prior&&!alreadyAnswered){const x=state.templates.find(t=>t.id===prior);if(x)Object.assign(x,{title:name,description,level,questions});else state.templates.push({id:fresh(),title:name,description,level,questions})}else{state.templates.push({id:fresh(),title:name,description,level,questions})}});
  if(!saved)return;
  const storageNotice=isVaultReady()?'Salvo no cofre criptografado.':'Salvo somente em memória; configure o cofre para persistir.';
  if(prior&&alreadyAnswered)message('Novo modelo criado para preservar as respostas da versão anterior. '+storageNotice);else message('Modelo criado. '+storageNotice);setDraft(null);view='models';render();return
 }
 if(kind==='response'){
  const t=templateBy(form.dataset.templateId),c=client(form.dataset.clientId);if(!t||!c||c.id!==activeClientId){message('Selecione o aluno novamente; o cadastro mudou durante o preenchimento.',true);return}
  const data=new FormData(form),answers={};t.questions.forEach((q,i)=>answers[i]=String(data.get('ans_'+i)||'').trim());
  if(Object.values(answers).some(x=>!x||x.length>600)){message('Preencha todas as respostas, respeitando o limite de caracteres.',true);return}
  const saved=await mutate(()=>state.responses.push({id:fresh(),templateId:t.id,templateTitle:t.title,questions:t.questions.map(q=>({label:q.label,type:qt(q)})),clientId:c.id,clientName:c.name,date:iso(),answers}));if(!saved)return;view='responses';render();message('Anamnese de '+c.name+' vinculada ao cadastro. '+(isVaultReady()?'Salva no cofre criptografado.':'Disponível só nesta sessão, até ativar o cofre.'));return
 }
}
async function onClick(e){const filt=e.target.closest('[data-ef2-level]');if(filt){levelFilter=filt.dataset.ef2Level;renderModels($(`${PAGE}-content`),true);return}const nav=e.target.closest('[data-ef2-page]');if(nav){view=nav.dataset.ef2Page;if(view==='builder'&&!editingTemplateId)setDraft(null);render();return}
 const b=e.target.closest('[data-ef2-action]');if(!b)return;const kind=b.dataset.ef2Action,id=b.dataset.id;
 if(kind==='fillTemplate'){if(!requireClient())return;activeTemplateId=id;view='fill';render();return}
 if(kind==='exportPDF'){exportFormPDF(id);return}
 if(kind==='copyTemplate'){const t=templateBy(id);if(!t)return;setDraft(t);view='builder';render();return}
 if(kind==='removeTemplate'){const t=state.templates.find(x=>x.id===id);if(!t)return;if(!confirm('Excluir o modelo "'+t.title+'"? As respostas já registradas serão preservadas.'))return;const removed=await mutate(()=>{state.templates=state.templates.filter(x=>x.id!==id)});if(removed)message('Modelo removido; respostas históricas preservadas.');return}
 if(kind==='openResponse'){openResponseId=id;view='response-detail';render();return}
 if(kind==='cancelBuilder'){setDraft(null);view='models';render();return}
 if(kind==='addQuestion'){if(draft.questions.length>=12)return;draft.questions.push({label:'',type:'long'});updateBuilder();$('ef2x-build-q'+(draft.questions.length-1))?.focus();return}
 if(['removeQuestion','upQuestion','downQuestion'].includes(kind)){
  const i=Number(b.dataset.index);if(!Number.isInteger(i)||i<0||i>=draft.questions.length)return;
  if(kind==='removeQuestion'&&draft.questions.length>1)draft.questions.splice(i,1);
  if(kind==='upQuestion'&&i>0)[draft.questions[i-1],draft.questions[i]]=[draft.questions[i],draft.questions[i-1]];
  if(kind==='downQuestion'&&i<draft.questions.length-1)[draft.questions[i+1],draft.questions[i]]=[draft.questions[i],draft.questions[i+1]];
  updateBuilder();return
 }
}
/* Acesso ao histórico de anamneses a partir da ficha de avaliação do aluno. */
function openForClient(id){
 const selected=client(String(id||''));
 if(!selected){message('Cadastro do aluno não localizado.',true);return false;}
 activeClientId=selected.id;view='responses';
 if(typeof window.switchTab==='function')window.switchTab(PAGE);
 render();return true;
}
function syncProfileShortcut(){
 const host=document.getElementById('patient-view-content');if(!host)return;
 const selectedId=window.avaliacaoEmVisualizacaoId || window.avaliacaoLaudoWebAtiva?.id;
 const a=getRecords().find(x=>String(x.id)===String(selectedId));
 let shortcut=document.getElementById('ef2f-profile-shortcut');
 if(!a){if(shortcut)shortcut.remove();return;}
 const id=clientKey(a),amount=state.responses.filter(x=>x.clientId===id).length;
 if(!shortcut){
  shortcut=document.createElement('section');shortcut.id='ef2f-profile-shortcut';
  shortcut.className='ef2f-profile-shortcut';
  const heading=document.createElement('strong');heading.textContent='Anamneses do aluno';
  const description=document.createElement('span');description.id='ef2f-profile-shortcut-info';
  const button=document.createElement('button');button.type='button';button.className='btn btn-secondary';button.textContent='Ver formulários e respostas';
  button.addEventListener('click',()=>openForClient(shortcut.dataset.clientId));
  shortcut.append(heading,description,button);host.append(shortcut);
 }
 shortcut.dataset.clientId=id;
 const info=shortcut.querySelector('#ef2f-profile-shortcut-info');
 if(info){const next=amount+' anamnese(s) registrada(s) para este cadastro';if(info.textContent!==next)info.textContent=next;}
}
function watchProfile(){
 const host=document.getElementById('patient-view-content');if(!host)return;
 const observer=new MutationObserver(()=>syncProfileShortcut());
 observer.observe(host,{childList:true});
 syncProfileShortcut();
 window.addEventListener('ef-records-changed',syncProfileShortcut);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchProfile,{once:true});else watchProfile();
window.EF2Forms={addDays,validISO,daysBetween,csv,clientKey,loadEncrypted,pdfForm,exportFormPDF,openForClient,show:()=>{view='models';window.switchTab(PAGE);render()},getState:()=>JSON.parse(JSON.stringify(state)),clients:()=>clients().map(c=>({id:c.id,name:c.name,count:c.records.length})),getSelectedClient:()=>activeClientId,presets:()=>PRESETS.map(t=>({id:t.id,title:t.title,level:levelOf(t),questions:t.questions.length})),render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

