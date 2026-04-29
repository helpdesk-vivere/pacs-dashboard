Chart.register(ChartDataLabels);

const API = "http://177.136.206.166:3000";

const dataInicio = document.getElementById("dataInicio");
const dataFim = document.getElementById("dataFim");
const hospital = document.getElementById("hospital");

const modalidadesChartEl = document.getElementById("modalidadesChart");
const examesChartEl = document.getElementById("examesChart");
const sexoChartEl = document.getElementById("sexoChart");

function getFiltro(){
  let q = [];
  if(dataInicio.value && dataFim.value)
    q.push(`inicio=${dataInicio.value}&fim=${dataFim.value}`);
  if(hospital.value)
    q.push(`hospital=${hospital.value}`);
  return q.length ? '?' + q.join('&') : '';
}

function corTexto(){
  return getComputedStyle(document.body).getPropertyValue('--text');
}

async function carregarHospitais(){
  const r = await fetch(API + "/hospitais");
  const d = await r.json();

  hospital.innerHTML = '<option value="">Todos</option>';
  d.forEach(h=>{
    hospital.innerHTML += `<option value="${h.id}">${h.nome}</option>`;
  });
}

async function carregarKPIs(){
  const t = await fetch(API + "/totais" + getFiltro()).then(r=>r.json());

  totalExames.innerText = t.estudos || 0;
  totalPacientes.innerText = t.pacientes || 0;

  const ex = await fetch(API + "/exames-dia" + getFiltro()).then(r=>r.json());
  let hoje = new Date().toISOString().slice(0,10).replaceAll('-','');

  examesHoje.innerText =
    ex.find(x => x.data === hoje)?.total || 0;

  const sx = await fetch(API + "/sexo" + getFiltro()).then(r=>r.json());

  totalMasculino.innerText =
    sx.find(x=>x.sexo==='M')?.total || 0;

  totalFeminino.innerText =
    sx.find(x=>x.sexo==='F')?.total || 0;

  const tat = await fetch(API + "/tempo-sr" + getFiltro()).then(r=>r.json());

  tatSR.innerText = tat.media || 0;
  sla1h.innerText = (tat.sla1h || 0) + "%";
  sla2h.innerText = (tat.sla2h || 0) + "%";

  const pend = await fetch(API + "/exames-pendentes" + getFiltro()).then(r=>r.json());
  examesPendentes.innerText = pend.pendentes || 0;
}

function formatar(d){
  return d ? `${d.slice(6,8)}-${d.slice(4,6)}-${d.slice(0,4)}` : "";
}

let c1,c2,c3;

async function carregarCharts(){
  const [mod, ex, sx] = await Promise.all([
    fetch(API + "/modalidades" + getFiltro()).then(r=>r.json()),
    fetch(API + "/exames-dia" + getFiltro()).then(r=>r.json()),
    fetch(API + "/sexo" + getFiltro()).then(r=>r.json())
  ]);

  if(c1) c1.destroy();
  if(c2) c2.destroy();
  if(c3) c3.destroy();

  c1 = new Chart(modalidadesChartEl,{
    type:'doughnut',
    data:{
      labels:mod.map(x=>x.modalidade),
      datasets:[{
        data:mod.map(x=>x.total),
        backgroundColor:['#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa']
      }]
    },
    options:{
      maintainAspectRatio:false,
      plugins:{
        legend:{ labels:{ color: corTexto() } },
        datalabels:{
          color:'#000',
          formatter:(v,ctx)=>{
            let t = ctx.dataset.data.reduce((a,b)=>a+b,0);
            return t ? ((v/t)*100).toFixed(0)+"%" : "";
          }
        }
      }
    }
  });

  c2 = new Chart(examesChartEl,{
    type:'bar',
    data:{
      labels:ex.map(x=>formatar(x.data)),
      datasets:[{
        data:ex.map(x=>x.total),
        backgroundColor:'#60a5fa'
      }]
    },
    options:{
      maintainAspectRatio:false,
      plugins:{
        legend:{ display:false },
        datalabels:{
          color:'#000',
          anchor:'center',
          align:'center',
          font:{ weight:'bold' }
        }
      },
      scales:{
        x:{ ticks:{ color: corTexto() } },
        y:{ ticks:{ color: corTexto() } }
      }
    }
  });

  c3 = new Chart(sexoChartEl,{
    type:'doughnut',
    data:{
      labels:["Masculino","Feminino"],
      datasets:[{
        data:[
          sx.find(x=>x.sexo==="M")?.total||0,
          sx.find(x=>x.sexo==="F")?.total||0
        ],
        backgroundColor:['#60a5fa','#f472b6']
      }]
    },
    options:{
      maintainAspectRatio:false,
      plugins:{
        legend:{ labels:{ color: corTexto() } },
        datalabels:{
          color:'#000',
          anchor:'center',
          align:'center',
          font:{ weight:'bold', size:14 },
          formatter:(v,ctx)=>{
            let t = ctx.dataset.data.reduce((a,b)=>a+b,0);
            return t ? ((v/t)*100).toFixed(0)+"%" : "";
          }
        }
      }
    }
  });
}

async function carregarTudo(){
  await carregarKPIs();
  await carregarCharts();
}

function toggleTheme(){
  document.body.classList.toggle('light');
  carregarCharts();
}

setInterval(carregarTudo,30000);

window.onload = async ()=>{
  let hoje = new Date();
  let ini = new Date();
  ini.setDate(hoje.getDate()-7);

  dataInicio.value = ini.toISOString().slice(0,10);
  dataFim.value = hoje.toISOString().slice(0,10);

  await carregarHospitais();
  await carregarTudo();
};