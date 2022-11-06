// const APIkassy = async () => {
//     let headers = new Headers({
//         "Accept"       : "application/json",
//         "Content-Type" : "application/json;charset=utf-8",
//         "User-Agent"   : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
//     });

//     let content = '<request db="sandbox" module="table_show" format="json"><params packet="full" /><filter ts_id="" id="" type_id="" is_visible="1" /><auth id="sandbox.kassy.ru" /></request>'
//     let blob = new Blob([content], {type: 'text/xml'})
//     let body = new FormData()

//     body.append('xml', blob)
//     body.append('sign', 'secret_key')

//     console.log(body)

//     let response = await fetch('https://api.kassy.ru/v4/', {
//         method: 'POST',
//         headers: headers,
//         body: body,
//     })
        

//     let data = await response.json()

//     console.log(data)
// }

// APIkassy()


const API = async (method, data) => {
    let response
    switch (method) {
        case 'GET':
            response = await fetch(`http://localhost:3000/api/events/${data}`)
            return await response.json()

        case 'POST':
            response = await fetch('http://localhost:3000/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(data),
            })

            break;

        case 'PATCH':
            response = await fetch(`http://localhost:3000/api/events/${data.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(data),
            })
            console.log(response)

            break;

        case 'DELETE':
            response = await fetch(`http://localhost:3000/api/events/${data}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify(data),
            })
            break;

        default:
            response = await fetch('http://localhost:3000/api/events')
            return await response.json()
    }
}

const createElement = (element) => {
    return document.createElement(element)
}

const createHeadRow = (data) => {
    const tableHead = createElement('thead')
    const headRow = createElement('tr')

    headRow.className = 'head__days'

    headRow.append(createElement('td'))

    for(let i = 0; i < data; i++) {
        const tableDiv = createElement('td')
        tableDiv.textContent = i + 1
        headRow.append(tableDiv)
    }

    tableHead.append(headRow)

    return {
        tableHead,
        headRow
    }
}

const createTableBody = (days, events) => {
    const body = createElement('tbody')
    const backRow = createRow('БЭК', 2, 'back', days, events)
    const stretchRow = createRow('Растяжка', 1, 'stretch', days, events)
    const mainRow = createRow('Большой баннер', 7, 'main', days, events)
    const middleRow = createRow('Средний баннер', 7, 'middle', days, events)
    const smallRow = createRow('Средний баннер', 7, 'small', days, events)

    

    body.append(backRow.mainRow, ...backRow.arr)
    body.append(stretchRow.mainRow, ...stretchRow.arr)
    body.append(mainRow.mainRow, ...mainRow.arr)
    body.append(middleRow.mainRow, ...middleRow.arr)
    body.append(smallRow.mainRow, ...smallRow.arr)

    if(events) {
        for(let ev of events) {
            let row = body.querySelector(`#${ev.place}`)
            let date = Array.from(row.querySelectorAll('[data-day]'))

            let start = new Date(ev.startedAt).getDate()
            let end = new Date(ev.endedAt).getDate()

            date.map((el) => {
                if(Number(el.dataset.day) === Number(start)) {
                    el.className = 'active'
                    el.colSpan = end - (start-1)
                } else if(Number(el.dataset.day) > Number(start) && Number(el.dataset.day) <= Number(end)) {
                    el.remove()
                }
            })
        }
    }
    
    return {
        body,
        backRow,
        stretchRow,
        mainRow,
        middleRow,
        smallRow
    }
}

const createRow = (name, place, type, days, events) => {
    let mainRow = createElement('tr')
    let arr = []
    
    mainRow.textContent = name
    mainRow.dataset.target = type
    mainRow.style.cursor = 'pointer'

    for(let i = 0; i < place; i++) {
        let tr = createElement('tr')
        let div = createElement('td')
        tr.dataset.tab = type
        tr.classList = 'days'
        div.textContent = `Место ${i+1}`
        tr.id = `${type}_${i+1}`

        if(name === 'БЭК') tr.classList.add('active')

        const date = createCalendar(days, events)

        tr.append(div, ...date)
        arr.push(tr)
    }

    mainRow.addEventListener('click', function(e) {
        e.preventDefault()
        for(let i of arr) {
            i.classList.toggle('active')
        }
    })

    return {
        mainRow,
        arr
    }
}

const createCalendar = (days, events) => {

    let arr = []

    for(let i = 0; i < days; i++) {
        let td = createElement('td')
        td.dataset.day = i + 1
        arr.push(td)
    }



    return arr
}

const createPlace = (data) => {
    

    let start
    let end
    let arr = Array.from(document.querySelectorAll(`td[class="${data.place}"]`))
    
    start = new Date(data.startedAt).getDate()
    end = new Date(data.endedAt).getDate()

    document.querySelectorAll(`td[class="${data.place}"]`).forEach((el) => {
        console.log(el)
        let parent = el.parentElement
        parent.querySelectorAll(`[data-day]`).forEach((d) => {
            arr.push(d)
            if(Number(d.dataset.day) >= Number(start) && Number(d.dataset.day) <= Number(end)) {
                d.className = 'active'
            }
        })
    })

    console.log(start)
}

const createDate = async (e) => {
    e.preventDefault()
        let event = {
            place: `${document.querySelector('#type').value}_${document.querySelector('#place').value}`,
            startedAt: document.querySelector('#startedAt').value,
            endedAt: document.querySelector('#endedAt').value
        }

        API('POST', event)
        document.querySelector('form').reset()
}

const createTable = (days, events) => {
    const table = createElement('table')
    const tableHeadRow = createHeadRow(days)
    const tableBody = createTableBody(days, events)

    table.append(tableHeadRow.tableHead, tableBody.body)

    document.querySelector('.main').append(table)

    return {
        table,
        tableHeadRow,
        tableBody
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const date = new Date()
    const days = new Date(date.getUTCFullYear(), (date.getMonth() + 1), 0).getDate()
    const events = await API()
    const app = createTable(days, events)

    

    document.querySelector('button[type="submit"]').addEventListener('click', createDate)
})