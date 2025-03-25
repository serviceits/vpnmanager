const { executeQuery } = require('../db');

async function getNextFreeInterfaceAndPort(protocolType) {
  const validProtocols = {
    sstp: 'ppp',
    pptp: 'ppp',
    l2tp: 'ppp',
    openvpn: 'tun'
  };

  const interfacePrefix = validProtocols[protocolType];
  if (!interfacePrefix) {
    throw new Error(`Неизвестный тип протокола: ${protocolType}`);
  }

  try {
    const result = await executeQuery(
      'SELECT connection_number, rdm_port FROM vpn_connections WHERE connection_number LIKE @prefix',
      { prefix: `${interfacePrefix}%` }
    );

    // Обработка интерфейсов (только числа)
    const usedNumbers = result
      .map(row => parseInt(row.connection_number.replace(interfacePrefix, ''), 10))
      .sort((a, b) => a - b);

    let nextInterfaceNumber = 0;
    for (const num of usedNumbers) {
      if (num > nextInterfaceNumber) break;
      nextInterfaceNumber = num + 1;
    }

    // Обработка портов
    const usedPorts = result
      .map(row => row.rdm_port)
      .filter(port => port !== null && port !== undefined)
      .sort((a, b) => a - b);

    let nextPort = 10050; // Начальный порт
    for (const port of usedPorts) {
      if (port > nextPort) break;
      nextPort = port + 1;
    }

    return { newInterface: nextInterfaceNumber, rdmPort: nextPort, interfacePrefix };
  } catch (error) {
    console.error('Ошибка при поиске свободного интерфейса или порта:', error.message);
    throw error;
  }
}

module.exports = { getNextFreeInterfaceAndPort };