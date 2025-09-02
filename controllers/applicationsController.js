require('dotenv').config();
const {DateTime} = require('luxon');
const axios = require('axios');
const db = require('../database/db');

class ApplicationsController {
  async add(req, res) {
    try {
      const { tg_username, time, network, amount, type, address, date, chat_id } = req.body;

      const nowMSK = DateTime.now().setZone("Europe/Moscow");
      const nowDate = date || nowMSK.toFormat("yyyy-MM-dd");
      const nowTimestamp = nowMSK.toFormat("yyyy-MM-dd HH:mm:ss");
      
      const existingApp = await db("applications")
        .whereRaw(`to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI:SS') >= ?`, [nowTimestamp])
        .andWhere("tg_username", tg_username)
        .first();

      if (existingApp) {
        return res.status(400).json({ error: "У Вас уже есть активная запись" });
      }

      const busyOperators = await db("applications")
        .where("date", date)
        .where("time", time)
        .pluck("operator_id");

      const freeOperators = await db("operators")
        .whereNotIn("id", busyOperators);

      if (!freeOperators.length) {
        return res.status(400).json({ error: "Нет свободных операторов" });
      }

      const randomOperator = freeOperators[Math.floor(Math.random() * freeOperators.length)];

      const [inserted] = await db("applications")
        .insert({
          tg_username,
          time,
          date: nowDate,
          network,
          amount,
          type,
          address,
          operator_id: randomOperator.id,
        })
        .returning("id");

      if (chat_id) {
        await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          chat_id,
          text: `Ваша заявка принята!\nОператор @${randomOperator.tg_username} свяжется с Вами.`
        });
      }

      req.io.emit('needRefresh');

      res.status(201).json({ id: inserted.id, operator_id: randomOperator.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
  
  async delete(req, res) {
    try {
      const {id} = req.params;

      if (!id) {
        return res.status(400).json({ error: "ID заявки не передан" });
      }

      const existingApp = await db("applications").where({ id }).first();
      if (!existingApp) {
        return res.status(404).json({ error: "Заявка не найдена" });
      }

      await db("applications").where({ id }).del();

      res.status(200).json({ message: "Заявка успешно удалена" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  async getAvailableHours(req, res) {
    try {
      const { date } = req.params;
      if (!date) return res.status(400).json({ error: "Дата не передана" });

      const interval = await db("hours").first("start", "end");
      if (!interval) return res.status(400).json({ error: "Нет интервала работы" });
      
      const apps = await db("applications")
        .where("date", date)
        .select("time", "operator_id");
    
      const operators = await db("operators").pluck("id");
    
      const freeSlots = [];

      let slotStart = DateTime.fromFormat(interval.start.split('.')[0], "HH:mm:ss", { zone: "Europe/Moscow" });
      const slotEnd = DateTime.fromFormat(interval.end.split('.')[0], "HH:mm:ss", { zone: "Europe/Moscow" });

      while (slotStart < slotEnd) {
        const slotTimeStr = slotStart.toFormat("HH:mm:ss");

        const busyOps = apps
          .filter(app => app.time === slotTimeStr)
          .map(app => app.operator_id);
          
        if (operators.some(op => !busyOps.includes(op))) {
          freeSlots.push(slotTimeStr);
        }

        slotStart = slotStart.plus({ minutes: 15 });
      }
      
      res.status(200).json(
        freeSlots.map((time) => {
          const parts = time.split(':');

          return `${parts[0]}:${parts[1]}`; 
        }) 
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  async getByDate(req, res) {
    try {
      const { date } = req.params;
      if (!date) {
        return res.status(400).json({ error: "Дата не передана" });
      }

      const hours = await db("hours").first("start", "end");
      if (!hours) {
        return res.status(400).json({ error: "Интервал работы не задан" });
      }

      const applications = await db("applications")
        .join("operators", "applications.operator_id", "operators.id") // джоиним таблицу operators
        .where("applications.date", date)
        .select(
          "applications.*",
          'operators.tg_username as operator_username'
        );


      const result = {
        hours: {
          start: hours.start,
          end: hours.end
        },
        applications
      };

      res.status(200).json(result);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getRandomOperator(_, res) {
    const operators = await db("operators").pluck("tg_username");

    const randomOperator = operators[Math.floor(Math.random() * operators.length)];

    res.status(200).json({ operator: randomOperator });
  }

  async getUSDTRate(req, res) {
    const response = await axios.get('https://api.rapira.net/open/market/rates');

    const rates = response.data.data;

    const usdtRate = rates.find(rate => rate.symbol === 'USDT/RUB');

    res.status(200).json(usdtRate);
  }
}
module.exports = new ApplicationsController();

