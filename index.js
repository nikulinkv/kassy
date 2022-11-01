let newArr = [
    // {
    //     place: 'back_1',
    //     company: 'ООО Большие гастроли',
    //     event: 'Фрида',
    //     startedAt: '2022-11-05',
    //     endedAt: '2022-11-10',
    //     summ: '10000',
    // },
    // {
    //     place: 'back_1',
    //     company: 'ООО Большие гастроли',
    //     event: 'Фрида',
    //     startedAt: '2022-11-12',
    //     endedAt: '2022-11-20',
    //     summ: '10000',
    // },
    // {
    //     place: 'back_2',
    //     company: 'ООО Большие гастроли',
    //     event: 'Фрида',
    //     startedAt: '2022-11-03',
    //     endedAt: '2022-11-12',
    //     summ: '10000',
    // },
    // {
    //     place: 'main_1',
    //     company: 'ООО Большие гастроли',
    //     event: 'Фрида',
    //     startedAt: '2022-11-03',
    //     endedAt: '2022-11-12',
    //     summ: '10000',
    // },
]

const createHeadRow = (data) => {
    const tableHead = document.querySelector('.head__days')
    tableHead.append(document.createElement('td'))
    tableHead.append(document.createElement('td'))

    for(let i = 0; i < data; i++) {
        const tableDiv = document.createElement('td')
        tableDiv.textContent = i + 1
        tableHead.append(tableDiv)
    }
}

const createPlace = (data) => {
    let start
    let end
    
    start = new Date(data.startedAt).getDate()
    end = new Date(data.endedAt).getDate()

    document.querySelectorAll(`td[class="${data.place}"]`).forEach((el) => {
        let parent = el.parentElement
        parent.querySelectorAll(`[data-day]`).forEach((d) => {
            if(Number(d.dataset.day) >= Number(start) && Number(d.dataset.day) <= Number(end)) {
                d.className = 'active'
            }
        })
    })
}

const createCalendar = (data) => {
    document.querySelectorAll('tr[class="days"]').forEach((el) => {
        for(let i = 0; i < data; i++) {
            let td = document.createElement('td')
            td.dataset.day = i + 1
            el.append(td)
        }
    })
}

const createDate = (e) => {
    e.preventDefault()
        let event = {
            place: `${document.querySelector('#type').value}_${document.querySelector('#place').value}`,
            startedAt: document.querySelector('#startedAt').value,
            endedAt: document.querySelector('#endedAt').value
        }

        newArr.push(event)
        createPlace(event)
        document.querySelector('form').reset()
}

document.addEventListener('DOMContentLoaded', () => {
    const date = new Date()
    const days = new Date(date.getUTCFullYear(), (date.getMonth() + 1), 0).getDate()

    createHeadRow(days)
    createCalendar(days)

    for (let place of newArr) {
        createPlace(place)
    }

    document.querySelectorAll('td[data-target]').forEach((el) => {
        el.addEventListener('click', (e) => {
            document.querySelectorAll(`[data-tab=${e.target.dataset.target}]`).forEach((el) => {
                el.classList.toggle('active')
            })
            if (e.target.dataset.target === 'stretch') return
            else if (document.querySelector(`[data-tab=${e.target.dataset.target}]`).classList.contains('active')) {
                e.target.rowSpan = (Array.from(document.querySelectorAll(`[data-tab=${e.target.dataset.target}]`)).length) + 1
            }
            else {
                e.target.rowSpan = 1
            }
        })
    })

    document.querySelector('button[type="submit"]').addEventListener('click', createDate)
})