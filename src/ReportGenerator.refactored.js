const PRIORITY_VALUE_THRESHOLD = 1000;
const STANDARD_USER_VALUE_LIMIT = 500;

const Role = Object.freeze({ ADMIN: 'ADMIN', USER: 'USER' });
const ReportType = Object.freeze({ CSV: 'CSV', HTML: 'HTML' });

class CsvFormat {
  header() {
    return 'ID,NOME,VALOR,USUARIO\n';
  }

  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  footer(total) {
    return `\nTotal,,\n${total},,\n`;
  }
}

class HtmlFormat {
  header(user) {
    return (
      '<html><body>\n' +
      '<h1>Relatório</h1>\n' +
      `<h2>Usuário: ${user.name}</h2>\n` +
      '<table>\n' +
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n'
    );
  }

  row(item, user, highlighted) {
    const style = highlighted ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  footer(total) {
    return `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`;
  }
}

/** Tipos de relatório desconhecidos geram um relatório vazio. */
class EmptyFormat {
  header() {
    return '';
  }

  row() {
    return '';
  }

  footer() {
    return '';
  }
}

const EMPTY_FORMAT = new EmptyFormat();

const FORMATS = new Map([
  [ReportType.CSV, new CsvFormat()],
  [ReportType.HTML, new HtmlFormat()],
]);

class AdminAccess {
  /** Mantém o comportamento original: a prioridade é gravada no item recebido. */
  select(items) {
    for (const item of items) {
      if (item.value > PRIORITY_VALUE_THRESHOLD) {
        item.priority = true;
      }
    }

    return items;
  }

  isHighlighted(item) {
    return Boolean(item.priority);
  }
}

class StandardUserAccess {
  select(items) {
    return items.filter((item) => item.value <= STANDARD_USER_VALUE_LIMIT);
  }

  isHighlighted() {
    return false;
  }
}

/** Papéis desconhecidos não veem nenhum item. */
class NoAccess {
  select() {
    return [];
  }

  isHighlighted() {
    return false;
  }
}

const NO_ACCESS = new NoAccess();

const ACCESS_BY_ROLE = new Map([
  [Role.ADMIN, new AdminAccess()],
  [Role.USER, new StandardUserAccess()],
]);

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const format = FORMATS.get(reportType) ?? EMPTY_FORMAT;
    const access = ACCESS_BY_ROLE.get(user.role) ?? NO_ACCESS;
    let report = format.header(user);
    let total = 0;

    for (const item of access.select(items)) {
      report += format.row(item, user, access.isHighlighted(item));
      total += item.value;
    }

    report += format.footer(total);

    return report.trim();
  }
}
