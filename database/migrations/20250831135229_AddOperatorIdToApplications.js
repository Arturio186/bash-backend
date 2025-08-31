/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.table("applications", (table) => {
    table
      .integer("operator_id")
      .unsigned()
      .references("id")
      .inTable("operators")
      .onDelete("SET NULL")   // если оператор удалён → operator_id станет NULL
      .onUpdate("CASCADE");   // если id у оператора изменится → обновится и тут
  });
};

/**
 * @param { import("knex").Knex } knexы
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.table("applications", (table) => {
    table.dropColumn("operator_id");
  });
};
