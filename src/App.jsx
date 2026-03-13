import React, { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const STORAGE_KEY = 'food-calendar-review-v1'

const BASE_FOODS = [
  { name: '米饭', kcal: 116, protein: 2.6, fat: 0.3, carbs: 25.9 },
  { name: '鸡胸肉', kcal: 133, protein: 19.4, fat: 5.0, carbs: 1.2 },
  { name: '甜虾', kcal: 87, protein: 19.5, fat: 0.3, carbs: 0.7 },
  { name: '鸡蛋', kcal: 144, protein: 13.3, fat: 8.8, carbs: 2.8 },
  { name: '鸡蛋白', kcal: 52, protein: 11.0, fat: 0.2, carbs: 1.0 },
  { name: '希腊酸奶', kcal: 73, protein: 9.0, fat: 2.5, carbs: 5.0 },
  { name: '酸奶', kcal: 72, protein: 2.5, fat: 2.7, carbs: 9.3 },
  { name: '牛奶', kcal: 61, protein: 3.0, fat: 3.2, carbs: 3.4 },
  { name: '燕麦', kcal: 389, protein: 16.9, fat: 6.9, carbs: 66.3 },
  { name: '红薯', kcal: 86, protein: 1.6, fat: 0.1, carbs: 20.1 },
  { name: '西兰花', kcal: 34, protein: 2.8, fat: 0.4, carbs: 6.6 },
  { name: '香蕉', kcal: 93, protein: 1.4, fat: 0.2, carbs: 22.0 },
  { name: '苹果', kcal: 53, protein: 0.3, fat: 0.2, carbs: 13.7 },
  { name: '卤牛肉', kcal: 195, protein: 28.0, fat: 8.0, carbs: 2.0 },
  { name: '卤鸡腿', kcal: 215, protein: 18.5, fat: 15.0, carbs: 1.8 },
  { name: '卤肘子', kcal: 290, protein: 21.0, fat: 22.0, carbs: 1.5 }
]

const EXTRA_FOODS = [
  { name: '糙米饭', kcal: 111, protein: 2.7, fat: 0.9, carbs: 23.0 },
  { name: '白粥', kcal: 46, protein: 1.1, fat: 0.2, carbs: 9.9 },
  { name: '馒头', kcal: 223, protein: 7.0, fat: 1.1, carbs: 47.0 },
  { name: '面条', kcal: 137, protein: 4.5, fat: 0.7, carbs: 28.1 },
  { name: '豆腐', kcal: 81, protein: 8.1, fat: 4.2, carbs: 1.9 },
  { name: '番茄', kcal: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
  { name: '黄瓜', kcal: 16, protein: 0.8, fat: 0.1, carbs: 3.6 },
  { name: '金枪鱼', kcal: 144, protein: 23.3, fat: 4.9, carbs: 0 },
  { name: '羊肉', kcal: 203, protein: 19.0, fat: 13.6, carbs: 0 },
  { name: '低脂酸奶', kcal: 50, protein: 3.0, fat: 1.5, carbs: 6.0 }
]

const DEFAULT_PROFILE = { sex: 'female', age: '28', height: '160', weight: '60' }
const UNIT_GRAMS = { g: 1, '100g': 100, 个: 50, 枚: 10, 盒: 200, 袋: 100, 杯: 250, 瓶: 500, 片: 30, 勺: 15 }
const DEFAULT_PORTIONS = {
  鸡蛋: { 个: 50 },
  鸡蛋白: { 个: 30 },
  希腊酸奶: { 盒: 135 },
  酸奶: { 盒: 200 },
  牛奶: { 盒: 250, 瓶: 250 },
  香蕉: { 个: 120 },
  苹果: { 个: 180 }
}

function round1(n) { return Math.round(n * 10) / 10 }
function kjToKcal(kj) { return round1(Number(kj) / 4.184) }
function todayStr() { return new Date().toISOString().slice(0, 10) }
function calcBMR(p) {
  const age = Number(p.age) || 0
  const height = Number(p.height) || 0
  const weight = Number(p.weight) || 0
  if (!age || !height || !weight) return 0
  return p.sex === 'male' ? round1(10 * weight + 6.25 * height - 5 * age + 5) : round1(10 * weight + 6.25 * height - 5 * age - 161)
}
function parseExercise(text) {
  const m = text.trim().match(/(\d+(?:\.\d+)?)\s*(?:kcal|大卡|千卡|卡)/i)
  if (!m) return null
  return { name: text.replace(m[0], '').trim() || '运动', kcal: round1(Number(m[1])) }
}

export default function App() {
  const [foods, setFoods] = useState(BASE_FOODS)
  const [foodPortions, setFoodPortions] = useState(DEFAULT_PORTIONS)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [dateInput, setDateInput] = useState(todayStr())
  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState(BASE_FOODS[0])
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('g')
  const [mealItems, setMealItems] = useState([])
  const [dailyRecords, setDailyRecords] = useState({})
  const [exerciseInput, setExerciseInput] = useState('')
  const [exerciseRecords, setExerciseRecords] = useState({})
  const [weightInput, setWeightInput] = useState('')
  const [weightRecords, setWeightRecords] = useState({})
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [newFood, setNewFood] = useState({ name: '', kcal: '', kj: '', protein: '', fat: '', carbs: '', portionUnit: '', portionWeight: '' })
  const [foodLibraryNotice, setFoodLibraryNotice] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [copyNotice, setCopyNotice] = useState('')
  const [shareNotice, setShareNotice] = useState('')
  const [showManualCopy, setShowManualCopy] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved.foods) setFoods(saved.foods)
      if (saved.foodPortions) setFoodPortions(saved.foodPortions)
      if (saved.selectedDate) { setSelectedDate(saved.selectedDate); setDateInput(saved.selectedDate) }
      if (saved.dailyRecords) setDailyRecords(saved.dailyRecords)
      if (saved.exerciseRecords) setExerciseRecords(saved.exerciseRecords)
      if (saved.weightRecords) setWeightRecords(saved.weightRecords)
      if (saved.profile) setProfile(saved.profile)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foods, foodPortions, selectedDate, dailyRecords, exerciseRecords, weightRecords, profile }))
  }, [foods, foodPortions, selectedDate, dailyRecords, exerciseRecords, weightRecords, profile])

  useEffect(() => {
    setMealItems(dailyRecords[selectedDate] || [])
  }, [selectedDate, dailyRecords])

  const filteredFoods = useMemo(() => query.trim() ? foods.filter(f => f.name.toLowerCase().includes(query.toLowerCase())) : foods, [foods, query])
  const noMatch = query.trim() && filteredFoods.length === 0
  const actualGrams = useMemo(() => {
    const val = Number(amount) || 0
    if (val <= 0) return 0
    if (unit === 'g') return val
    if (unit === '100g') return val * 100
    return round1(val * (foodPortions[selectedFood?.name]?.[unit] || UNIT_GRAMS[unit] || 1))
  }, [amount, unit, selectedFood, foodPortions])

  const currentResult = useMemo(() => {
    if (!selectedFood || actualGrams <= 0) return { kcal: 0, protein: 0, fat: 0, carbs: 0 }
    const ratio = actualGrams / 100
    return {
      kcal: round1(selectedFood.kcal * ratio),
      protein: round1(selectedFood.protein * ratio),
      fat: round1(selectedFood.fat * ratio),
      carbs: round1(selectedFood.carbs * ratio)
    }
  }, [selectedFood, actualGrams])

  const mealTotals = useMemo(() => mealItems.reduce((a, x) => ({ kcal: round1(a.kcal + x.kcal), protein: round1(a.protein + x.protein), fat: round1(a.fat + x.fat), carbs: round1(a.carbs + x.carbs) }), { kcal: 0, protein: 0, fat: 0, carbs: 0 }), [mealItems])
  const dailyLog = dailyRecords[selectedDate] || []
  const dailyTotals = useMemo(() => dailyLog.reduce((a, x) => ({ kcal: round1(a.kcal + x.kcal), protein: round1(a.protein + x.protein), fat: round1(a.fat + x.fat), carbs: round1(a.carbs + x.carbs) }), { kcal: 0, protein: 0, fat: 0, carbs: 0 }), [dailyLog])
  const exerciseLog = exerciseRecords[selectedDate] || []
  const exerciseTotal = round1(exerciseLog.reduce((s, x) => s + x.kcal, 0))
  const bmr = calcBMR(profile)
  const totalBurn = round1(bmr + exerciseTotal)
  const energyBalance = round1(dailyTotals.kcal - totalBurn)
  const foodSummary = dailyLog.length ? dailyLog.map(x => `${x.name}（${x.displayAmount || `${x.grams}g`}）`).join('，') : '今日未记录具体食材'
  const summaryText = `日期：${selectedDate}。今日摄入 ${dailyTotals.kcal} kcal；基础代谢 ${bmr} kcal；运动消耗 ${exerciseTotal} kcal；总消耗 ${totalBurn} kcal；${energyBalance >= 0 ? `热量盈余 ${energyBalance}` : `热量缺口 ${Math.abs(energyBalance)}`} kcal。蛋白质 ${dailyTotals.protein} g，脂肪 ${dailyTotals.fat} g，碳水 ${dailyTotals.carbs} g。今日摄入食材：${foodSummary}。分析今日饮食`

  const weightChartData = Object.keys(weightRecords).sort().map(date => ({ date: date.slice(5), fullDate: date, weight: Number(weightRecords[date]) })).filter(x => x.weight > 0)
  const latestWeight = weightChartData.length ? weightChartData[weightChartData.length - 1].weight : 0
  const prevWeight = weightChartData.length > 1 ? weightChartData[weightChartData.length - 2].weight : 0
  const weightChange = weightChartData.length > 1 ? round1(latestWeight - prevWeight) : 0
  const availableDates = Array.from(new Set([...Object.keys(dailyRecords), ...Object.keys(exerciseRecords), ...Object.keys(weightRecords)])).sort((a,b)=>b.localeCompare(a))

  const calendar = useMemo(() => {
    const [y, m] = (dateInput || selectedDate).split('-').map(Number)
    const first = new Date(y, m - 1, 1)
    const start = first.getDay()
    const days = new Date(y, m, 0).getDate()
    const cells = []
    for (let i = 0; i < start; i++) cells.push({ empty: true, key: `e-${i}` })
    for (let d = 1; d <= days; d++) {
      const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      cells.push({ day: d, dateStr, hasFood: Boolean((dailyRecords[dateStr]||[]).length), hasExercise: Boolean((exerciseRecords[dateStr]||[]).length), hasWeight: Boolean(weightRecords[dateStr]) })
    }
    return { year: y, month: m, cells }
  }, [dateInput, selectedDate, dailyRecords, exerciseRecords, weightRecords])

  function addFoodToDay() {
    const n = Number(amount) || 0
    if (!selectedFood || n <= 0) return
    const item = { id: `${Date.now()}-${Math.random()}`, name: selectedFood.name, grams: actualGrams, displayAmount: `${n}${unit}`, ...currentResult }
    setDailyRecords(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), item] }))
    setAmount('')
  }
  function removeMealItem(id) {
    setDailyRecords(prev => ({ ...prev, [selectedDate]: (prev[selectedDate] || []).filter(x => x.id !== id) }))
  }
  function addExercise() {
    const parsed = parseExercise(exerciseInput)
    if (!parsed) return
    setExerciseRecords(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), { id: `${Date.now()}-${Math.random()}`, ...parsed }] }))
    setExerciseInput('')
  }
  function addWeight() {
    const val = Number(weightInput)
    if (!val || val <= 0) return
    setWeightRecords(prev => ({ ...prev, [selectedDate]: round1(val) }))
    setProfile(prev => ({ ...prev, weight: String(round1(val)) }))
    setWeightInput('')
  }
  function addNewFood() {
    const kcal = newFood.kcal ? Number(newFood.kcal) : newFood.kj ? kjToKcal(newFood.kj) : NaN
    const payload = { name: newFood.name.trim(), kcal, protein: Number(newFood.protein), fat: Number(newFood.fat), carbs: Number(newFood.carbs) }
    if (!payload.name) return
    if ([payload.kcal, payload.protein, payload.fat, payload.carbs].some(v => Number.isNaN(v))) return
    setFoods(prev => [payload, ...prev])
    if (newFood.portionUnit && newFood.portionWeight) {
      setFoodPortions(prev => ({ ...prev, [payload.name]: { ...(prev[payload.name] || {}), [newFood.portionUnit]: Number(newFood.portionWeight) } }))
    }
    setFoodLibraryNotice(`已添加食物：${payload.name}`)
    setNewFood({ name: '', kcal: '', kj: '', protein: '', fat: '', carbs: '', portionUnit: '', portionWeight: '' })
    setShowAddModal(false)
    setQuery(payload.name)
  }
  function importExtraFoods() {
    setFoods(prev => mergeFoods(prev, EXTRA_FOODS))
    setFoodLibraryNotice(`已补充 ${EXTRA_FOODS.length} 个常见食物到食物库。`)
  }
  async function copySummary() {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('clipboard blocked')
      await navigator.clipboard.writeText(summaryText)
      setCopyNotice('已复制每日总结。打开 ChatGPT 后直接粘贴就行。')
    } catch {
      setCopyNotice('当前环境不支持直接复制，已为你打开手动复制面板。长按下面文字复制即可。')
      setShowManualCopy(true)
    }
    setTimeout(() => setCopyNotice(''), 2600)
  }
  async function shareSummary() {
    try {
      if (navigator.share) {
        await navigator.share({ title: '每日饮食总结', text: summaryText })
        setShareNotice('已打开系统分享面板。')
      } else {
        setShareNotice('当前环境不支持系统分享，先用复制总结会更稳。')
      }
    } catch {
      setShareNotice('分享没有完成。')
    }
    setTimeout(() => setShareNotice(''), 2600)
  }
  function openChatGPT() {
    const prompt = encodeURIComponent(summaryText)
    const deep = `chatgpt://open?prompt=${prompt}`
    const web = `https://chatgpt.com/?q=${prompt}`
    window.location.href = deep
    setTimeout(() => window.open(web, '_blank', 'noopener,noreferrer'), 700)
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(foods, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'foods_database.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <div className="grid">
        <div className="col">
          <div className="card">
            <div className="title">日期与历史记录</div>
            <div className="sub">点击日期可以回看当天的饮食、运动、体重记录，也可以继续往当天添加新内容。</div>
            <div className="row" style={{marginTop:12}}>
              <input type="date" value={dateInput} onChange={(e)=>setDateInput(e.target.value)} className="input" />
              <button className="btn" onClick={()=>setSelectedDate(dateInput)}>切换到该日期</button>
              <button className="btn secondary" onClick={()=>{ const t=todayStr(); setDateInput(t); setSelectedDate(t)}}>回到今天</button>
            </div>
            <div className="card" style={{marginTop:14, padding:12, background:'#f8fafc'}}>
              <div className="row" style={{justifyContent:'space-between'}}>
                <div style={{fontWeight:700}}>{calendar.year} 年 {calendar.month} 月</div>
                <div className="small">当前记录日期：{selectedDate}</div>
              </div>
              <div className="calendar-grid" style={{marginTop:10}}>
                {['日','一','二','三','四','五','六'].map(d => <div key={d} className="calendar-head">{d}</div>)}
                {calendar.cells.map(cell => cell.empty ? <div key={cell.key} className="day empty" /> : (
                  <button key={cell.dateStr} className={`day ${selectedDate===cell.dateStr?'active':''}`} onClick={()=>{setDateInput(cell.dateStr);setSelectedDate(cell.dateStr)}}>
                    <div>{cell.day}</div>
                    <div className="badges">{cell.hasFood?'食':''}{cell.hasExercise?'动':''}{cell.hasWeight?'重':''}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="small" style={{marginTop:8}}>小字含义：食=有饮食记录，动=有运动记录，重=有体重记录。</div>
            <div className="row" style={{marginTop:10}}>
              {availableDates.length ? availableDates.map(date => <button key={date} className={`btn ${selectedDate===date?'':'secondary'}`} onClick={()=>{setSelectedDate(date);setDateInput(date)}}>{date}</button>) : <div className="small">还没有历史记录。</div>}
            </div>
          </div>

          <div className="card">
            <div className="title">食物热量与营养素计算器</div>
            <div className="sub">搜索食物、选择单位和数量，然后加入当天记录。</div>
            <div className="row" style={{marginTop:14}}>
              <div className="col" style={{flex:1}}>
                <div>搜索食物</div>
                <input className="input" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="例如：米饭、鸡胸肉、希腊酸奶" />
                {noMatch ? <div className="notice">没找到“{query}”。<div style={{marginTop:8}}><button className="btn secondary" onClick={()=>{setNewFood(s=>({...s,name:query.trim()}));setShowAddModal(true)}}>添加这个食物到食物库</button></div></div> : null}
              </div>
              <div className="col" style={{flex:1}}>
                <div>数量与单位</div>
                <div className="row">
                  <input className="input" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="例如：1 或 150" />
                  <select className="select" value={unit} onChange={(e)=>setUnit(e.target.value)}>
                    {Object.keys(UNIT_GRAMS).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="small">当前按约 {actualGrams} g 计算。{selectedFood && foodPortions[selectedFood.name] ? ` 已记录单位：${Object.entries(foodPortions[selectedFood.name]).map(([k,v])=>`${k}=${v}g`).join('，')}` : ''}</div>
              </div>
            </div>
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr', marginTop:14}}>
              <div className="card" style={{padding:12}}>
                <div style={{fontWeight:700, marginBottom:8}}>匹配到的食物</div>
                <div className="food-list">
                  {filteredFoods.map(food => (
                    <div key={food.name} className={`food-item ${selectedFood?.name===food.name?'active':''}`}>
                      <button style={{all:'unset', cursor:'pointer', display:'block', width:'100%'}} onClick={()=>setSelectedFood(food)}>
                        <div style={{fontWeight:600}}>{food.name}</div>
                        <div className="small">每100g：{food.kcal} kcal｜P {food.protein}g｜F {food.fat}g｜C {food.carbs}g</div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{padding:12}}>
                <div style={{fontWeight:700, marginBottom:8}}>当前计算结果</div>
                <div className="col small">
                  <div className="row" style={{justifyContent:'space-between'}}><span>食物</span><b>{selectedFood?.name || '未选择'}</b></div>
                  <div className="row" style={{justifyContent:'space-between'}}><span>输入数量</span><b>{Number(amount)||0} {unit}</b></div>
                  <div className="row" style={{justifyContent:'space-between'}}><span>折算重量</span><b>{actualGrams} g</b></div>
                  <div className="row" style={{justifyContent:'space-between'}}><span>热量</span><b>{currentResult.kcal} kcal</b></div>
                  <div className="row" style={{justifyContent:'space-between'}}><span>蛋白质</span><b>{currentResult.protein} g</b></div>
                  <div className="row" style={{justifyContent:'space-between'}}><span>脂肪</span><b>{currentResult.fat} g</b></div>
                  <div className="row" style={{justifyContent:'space-between'}}><span>碳水</span><b>{currentResult.carbs} g</b></div>
                </div>
                <button className="btn" style={{width:'100%', marginTop:12}} onClick={addFoodToDay}>加入本餐汇总</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="title">本餐汇总</div>
            <div className="metrics" style={{marginTop:12}}>
              <div className="metric"><div className="metric-label">热量</div><div className="metric-value">{mealTotals.kcal}</div><div className="small">kcal</div></div>
              <div className="metric"><div className="metric-label">蛋白质</div><div className="metric-value">{mealTotals.protein}</div><div className="small">g</div></div>
              <div className="metric"><div className="metric-label">脂肪</div><div className="metric-value">{mealTotals.fat}</div><div className="small">g</div></div>
              <div className="metric"><div className="metric-label">碳水</div><div className="metric-value">{mealTotals.carbs}</div><div className="small">g</div></div>
            </div>
            <div className="col" style={{marginTop:12}}>
              {mealItems.length ? mealItems.map(item => (
                <div className="meal-item" key={item.id}>
                  <div>
                    <div style={{fontWeight:600}}>{item.name} · {item.displayAmount || `${item.grams}g`}</div>
                    <div className="small">{item.kcal} kcal｜P {item.protein}g｜F {item.fat}g｜C {item.carbs}g</div>
                  </div>
                  <button className="btn danger" onClick={()=>removeMealItem(item.id)}>删除</button>
                </div>
              )) : <div className="small">当前日期还没有饮食记录。</div>}
            </div>
          </div>

          <div className="card">
            <div className="row" style={{justifyContent:'space-between'}}>
              <div className="title" style={{fontSize:22}}>每日总结</div>
              <div className="row">
                <button className="btn secondary" onClick={copySummary}>复制总结</button>
                <button className="btn secondary" onClick={shareSummary}>系统分享</button>
                <button className="btn" onClick={openChatGPT}>打开 ChatGPT</button>
              </div>
            </div>
            <div className="metrics" style={{marginTop:12}}>
              <div className="metric"><div className="metric-label">今日摄入</div><div className="metric-value">{dailyTotals.kcal}</div><div className="small">kcal</div></div>
              <div className="metric"><div className="metric-label">基础代谢</div><div className="metric-value">{bmr}</div><div className="small">kcal</div></div>
              <div className="metric"><div className="metric-label">运动消耗</div><div className="metric-value">{exerciseTotal}</div><div className="small">kcal</div></div>
              <div className="metric"><div className="metric-label">总消耗</div><div className="metric-value">{totalBurn}</div><div className="small">kcal</div></div>
            </div>
            {copyNotice ? <div className="small" style={{marginTop:10}}>{copyNotice}</div> : null}
            {shareNotice ? <div className="small" style={{marginTop:10}}>{shareNotice}</div> : null}
            <div className="summary-box" style={{marginTop:12}}>{summaryText}</div>
            <div className="notice" style={{marginTop:12}}>手机上推荐顺序是：先试系统分享，再试复制总结，最后用打开 ChatGPT。复制失败时会自动弹出手动复制面板。</div>
            {showManualCopy ? <div className="card" style={{marginTop:12, padding:12}}><div className="row" style={{justifyContent:'space-between'}}><div style={{fontWeight:700}}>手动复制每日总结</div><button className="btn secondary" onClick={()=>setShowManualCopy(false)}>关闭</button></div><textarea className="textarea hidden-copy" readOnly value={summaryText} /></div> : null}
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="title" style={{fontSize:22}}>食物库管理</div>
            <div className="col" style={{marginTop:12}}>
              <input className="input" placeholder="食物名称" value={newFood.name} onChange={(e)=>setNewFood(s=>({...s,name:e.target.value}))} />
              <div className="row">
                <input className="input" placeholder="kcal/100g" value={newFood.kcal} onChange={(e)=>setNewFood(s=>({...s,kcal:e.target.value,kj:e.target.value?'':s.kj}))} />
                <input className="input" placeholder="kJ/100g" value={newFood.kj} onChange={(e)=>setNewFood(s=>({...s,kj:e.target.value,kcal:e.target.value?'':s.kcal}))} />
              </div>
              <div className="row">
                <input className="input" placeholder="蛋白质/100g" value={newFood.protein} onChange={(e)=>setNewFood(s=>({...s,protein:e.target.value}))} />
                <input className="input" placeholder="脂肪/100g" value={newFood.fat} onChange={(e)=>setNewFood(s=>({...s,fat:e.target.value}))} />
              </div>
              <input className="input" placeholder="碳水/100g" value={newFood.carbs} onChange={(e)=>setNewFood(s=>({...s,carbs:e.target.value}))} />
              <div className="row">
                <input className="input" placeholder="自定义单位，例如：个 / 盒" value={newFood.portionUnit} onChange={(e)=>setNewFood(s=>({...s,portionUnit:e.target.value}))} />
                <input className="input" placeholder="该单位对应多少克，例如：30 / 135" value={newFood.portionWeight} onChange={(e)=>setNewFood(s=>({...s,portionWeight:e.target.value}))} />
              </div>
              <div className="notice">可选：给食物添加自定义单位换算。比如“鸡蛋白 1个=30g”“希腊酸奶 1盒=135g”。</div>
              <button className="btn" onClick={addNewFood}>添加到食物库</button>
              <button className="btn secondary" onClick={importExtraFoods}>一键补充更多常见食物</button>
              <button className="btn secondary" onClick={exportJson}>导出食物库 JSON</button>
              {foodLibraryNotice ? <div className="small">{foodLibraryNotice}</div> : null}
            </div>
          </div>

          <div className="card">
            <div className="title" style={{fontSize:22}}>基础代谢计算</div>
            <div className="col" style={{marginTop:12}}>
              <select className="select" value={profile.sex} onChange={(e)=>setProfile(s=>({...s,sex:e.target.value}))}>
                <option value="female">女性</option>
                <option value="male">男性</option>
              </select>
              <div className="row">
                <input className="input" value={profile.age} onChange={(e)=>setProfile(s=>({...s,age:e.target.value}))} placeholder="年龄" />
                <input className="input" value={profile.height} onChange={(e)=>setProfile(s=>({...s,height:e.target.value}))} placeholder="身高 cm" />
              </div>
              <input className="input" value={profile.weight} onChange={(e)=>setProfile(s=>({...s,weight:e.target.value}))} placeholder="体重 kg" />
              <div className="metric"><div className="metric-label">基础代谢 BMR</div><div className="metric-value">{bmr}</div><div className="small">kcal / day</div></div>
            </div>
          </div>

          <div className="card">
            <div className="row" style={{justifyContent:'space-between'}}><div className="title" style={{fontSize:22}}>体重统计</div><div className="small">当前日期：{selectedDate}</div></div>
            <div className="row" style={{marginTop:12}}>
              <input className="input" value={weightInput} onChange={(e)=>setWeightInput(e.target.value)} placeholder="输入今日体重 kg" />
              <button className="btn" onClick={addWeight}>保存体重</button>
            </div>
            <div className="metrics" style={{marginTop:12}}>
              <div className="metric"><div className="metric-label">当前日期体重</div><div className="metric-value">{weightRecords[selectedDate] || '--'}</div><div className="small">kg</div></div>
              <div className="metric"><div className="metric-label">最近一次体重</div><div className="metric-value">{latestWeight || '--'}</div><div className="small">kg</div></div>
              <div className="metric"><div className="metric-label">较上次变化</div><div className="metric-value">{weightChartData.length>1 ? weightChange : '--'}</div><div className="small">kg</div></div>
            </div>
            <div className="card" style={{marginTop:12, padding:12}}>
              <div style={{fontWeight:700, marginBottom:8}}>体重变化曲线</div>
              {weightChartData.length ? <div style={{width:'100%', height:260}}><ResponsiveContainer><LineChart data={weightChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(v)=>[`${v} kg`,'体重']} labelFormatter={(l,p)=>p?.[0]?.payload?.fullDate || l} /><Line type="monotone" dataKey="weight" strokeWidth={2} dot /></LineChart></ResponsiveContainer></div> : <div className="small">还没有体重记录。</div>}
            </div>
          </div>

          <div className="card">
            <div className="row" style={{justifyContent:'space-between'}}><div className="title" style={{fontSize:22}}>当日运动</div><div className="small">当前日期：{selectedDate}</div></div>
            <div className="row" style={{marginTop:12}}>
              <input className="input" value={exerciseInput} onChange={(e)=>setExerciseInput(e.target.value)} placeholder="例如：跑步 320 kcal" />
              <button className="btn" onClick={addExercise}>添加运动</button>
            </div>
            <div className="col" style={{marginTop:12}}>
              {exerciseLog.length ? exerciseLog.map(item => <div key={item.id} className="meal-item"><div><div style={{fontWeight:600}}>{item.name}</div><div className="small">{item.kcal} kcal</div></div><button className="btn danger" onClick={()=>setExerciseRecords(prev=>({...prev,[selectedDate]:(prev[selectedDate]||[]).filter(x=>x.id!==item.id)}))}>删除</button></div>) : <div className="small">还没有记录运动。</div>}
            </div>
          </div>

          <div className="card">
            <div className="title" style={{fontSize:22}}>数据保存说明</div>
            <div className="col small" style={{marginTop:10}}>
              <div>• 点击小日历的日期，可以回看当天已经记录的饮食、运动、体重。</div>
              <div>• 每日总结会带上当天摄入食材，结尾固定是“分析今日饮食”。</div>
              <div>• 支持复制总结、系统分享，以及尽量拉起 ChatGPT App。</div>
              <div>• 数据保存在当前浏览器 localStorage。刷新一般不会丢，但换设备不会同步。</div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal ? (
        <div className="modal-backdrop" onClick={()=>setShowAddModal(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <div style={{fontWeight:700,fontSize:20}}>添加食物到食物库</div>
              <button className="btn secondary" onClick={()=>setShowAddModal(false)}>关闭</button>
            </div>
            <div className="small" style={{marginTop:8}}>没搜到“{query}”，可以在这里补充营养数据并保存到食物库。</div>
            <div className="col" style={{marginTop:12}}>
              <input className="input" placeholder="食物名称" value={newFood.name} onChange={(e)=>setNewFood(s=>({...s,name:e.target.value}))} />
              <div className="row">
                <input className="input" placeholder="kcal/100g" value={newFood.kcal} onChange={(e)=>setNewFood(s=>({...s,kcal:e.target.value,kj:e.target.value?'':s.kj}))} />
                <input className="input" placeholder="kJ/100g" value={newFood.kj} onChange={(e)=>setNewFood(s=>({...s,kj:e.target.value,kcal:e.target.value?'':s.kcal}))} />
              </div>
              <div className="row">
                <input className="input" placeholder="蛋白质/100g" value={newFood.protein} onChange={(e)=>setNewFood(s=>({...s,protein:e.target.value}))} />
                <input className="input" placeholder="脂肪/100g" value={newFood.fat} onChange={(e)=>setNewFood(s=>({...s,fat:e.target.value}))} />
              </div>
              <input className="input" placeholder="碳水/100g" value={newFood.carbs} onChange={(e)=>setNewFood(s=>({...s,carbs:e.target.value}))} />
              <div className="row">
                <input className="input" placeholder="自定义单位，例如：个 / 盒" value={newFood.portionUnit} onChange={(e)=>setNewFood(s=>({...s,portionUnit:e.target.value}))} />
                <input className="input" placeholder="该单位对应多少克，例如：30 / 135" value={newFood.portionWeight} onChange={(e)=>setNewFood(s=>({...s,portionWeight:e.target.value}))} />
              </div>
              <button className="btn" onClick={addNewFood}>保存到食物库</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
