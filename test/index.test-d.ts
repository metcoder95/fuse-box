import { expectAssignable } from 'tsd';
import FuseBox, {
  FuseBoxWorkflow,
  FuseBox as NamedImportFuseBox,
  Workflows,
} from '../index';

const workload = (a: number, b: number): number => a + b;

expectAssignable<FuseBox>(new FuseBox());
expectAssignable<FuseBox>(new NamedImportFuseBox());
expectAssignable<FuseBox>(new FuseBox().protect(workload));
expectAssignable<FuseBox>(new NamedImportFuseBox().protect(workload));
expectAssignable<FuseBox>(
  new FuseBox().protect(workload).addWorkflows(Workflows.Retry())
);
expectAssignable<typeof workload>(
  new FuseBox()
    .protect(workload)
    .addWorkflows(Workflows.Retry(), Workflows.CircuitBreaker())
);
expectAssignable<typeof workload>(
  new FuseBox()
    .protect(workload)
    .addWorkflows([Workflows.Retry(), Workflows.CircuitBreaker()])
);
expectAssignable<typeof workload>(
  new FuseBox()
    .addWorkflows([Workflows.Retry(), Workflows.CircuitBreaker()])
    .protect(workload)
);
expectAssignable<typeof workload>(
  new NamedImportFuseBox()
    .addWorkflows([Workflows.Retry(), Workflows.CircuitBreaker()])
    .protect(workload)
);
expectAssignable<FuseBoxWorkflow>(Workflows.CircuitBreaker());
expectAssignable<FuseBoxWorkflow>(Workflows.Retry());
expectAssignable<FuseBoxWorkflow>(Workflows.Fallback({ value: 32 }));

// Workflows
// Fallback
expectAssignable(Workflows.Fallback({ value: 42 }));
expectAssignable(Workflows.Fallback({ value: () => 42 }));
expectAssignable(Workflows.Fallback({ value: () => Promise.resolve(42) }));
expectAssignable(Workflows.Fallback({ value: async () => 42 }));
