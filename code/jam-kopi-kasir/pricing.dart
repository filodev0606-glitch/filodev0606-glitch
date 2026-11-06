import '../models.dart';
import 'stock_allocation.dart';

class PercentComp {
  final String beanId;
  final double percent;
  const PercentComp(this.beanId, this.percent);
}

Bean? _find(List<Bean> beans, String id) {
  for (final b in beans) {
    if (b.id == id) return b;
  }
  return null;
}

double calcBeanPrice(
  String type,
  double totalGram,
  List<PercentComp> components,
  List<Bean> beans,
) {
  double sum = 0;
  for (final comp in components) {
    final bean = _find(beans, comp.beanId);
    if (bean == null) continue;
    final gram = totalGram * (comp.percent / 100);
    final pricePerGram =
        type == 'roast' ? bean.priceRoastPerGram : bean.priceGreenPerGram;
    sum += gram * pricePerGram;
  }
  return sum;
}

double calcBeanCost(
  String type,
  double totalGram,
  List<PercentComp> components,
  List<Bean> beans,
  AppSettings settings,
) {
  double sum = 0;
  for (final comp in components) {
    final bean = _find(beans, comp.beanId);
    if (bean == null) continue;
    final soldGram = totalGram * (comp.percent / 100);
    final stockGram = type == 'roast'
        ? soldGram * settings.roastRatio
        : soldGram * settings.greenRatio;
    double cost = stockGram * bean.costGreenPerGram;
    if (type == 'roast') {
      cost += stockGram * settings.roastingCostPerGram;
    }
    sum += cost;
  }
  return sum;
}

List<BeanComponent> buildComponents(
  double totalGram,
  List<PercentComp> components,
  List<Bean> beans,
) {
  return components.where((c) => c.percent > 0).map((c) {
    final bean = _find(beans, c.beanId);
    return BeanComponent(
      beanId: c.beanId,
      beanName: bean?.nama ?? 'Unknown',
      percent: c.percent,
      gram: totalGram * (c.percent / 100),
    );
  }).toList();
}

/// Green beans deducted from inventory for a roast sale (1 roast : [roastRatio] green).
/// Example: 100g roast sold → 130g green deducted when [roastRatio] is 1.3.
double roastGreenDeductionGram(double roastGramSold, AppSettings settings) =>
    roastGramSold * (settings.roastRatio > 0 ? settings.roastRatio : 1.0);

/// Legacy: green grams deducted if entire roast sale used green stock only.
/// Prefer [computeCartBeanStockUsage] / [computeAdjustmentForBean] for dual stock.
double getStockDeductionGram(
  String type,
  double totalGram,
  double percent,
  AppSettings settings,
) {
  final soldGram = totalGram * (percent / 100);
  return type == 'roast'
      ? roastGreenDeductionGram(soldGram, settings)
      : soldGram * settings.greenRatio;
}

String buildBeanLabel(List<BeanComponent> components) {
  if (components.isEmpty) return 'Kopi';
  if (components.length == 1) return components.first.beanName;
  final sorted = [...components]..sort((a, b) => b.percent.compareTo(a.percent));
  return '${sorted.first.beanName} Mix';
}

/// Returns a human-readable list of stock shortages for the given cart.
List<String> findStockShortages(
  List<CartItem> items,
  AppSettings settings,
  List<Bean> beans,
  List<DripProduct> drips,
) {
  final dripNeed = <String, int>{};

  for (final item in items) {
    if (item.isDrip) {
      final id = item.productId;
      if (id != null) {
        dripNeed[id] = (dripNeed[id] ?? 0) + item.qty;
      }
    }
  }

  final shortages = <String>[];

  final usage = computeCartBeanStockUsage(items, settings, beans);
  usage.forEach((id, u) {
    final bean = _find(beans, id);
    if (bean == null) return;
    if (u.roastStockUsed > bean.roastStockGram + 1e-6) {
      shortages.add(
          '${bean.nama}: butuh ${u.roastStockUsed.round()}g roast, stok roast ${bean.roastStockGram.round()}g');
    }
    if (u.greenStockUsed > bean.stockGram + 1e-6) {
      shortages.add(
          '${bean.nama}: butuh ${u.greenStockUsed.round()}g green, stok green ${bean.stockGram.round()}g');
    }
  });

  dripNeed.forEach((id, need) {
    DripProduct? drip;
    for (final p in drips) {
      if (p.id == id) {
        drip = p;
        break;
      }
    }
    if (drip == null) return;
    if (need > drip.stockPcs) {
      shortages.add(
          '${drip.variant} ${drip.sizeGram}g: butuh $need pcs, stok ${drip.stockPcs} pcs');
    }
  });
  return shortages;
}
